// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './HemDealer.sol';

interface IAcrossMessageVerifier {
  function verifyMessageFromAcross(bytes32 messageHash) external view returns (bool);
}

interface ISpokePool {
  function deposit(
    uint32 destinationChainId,
    address recipient,
    address token,
    uint256 amount,
    uint256 relayerFeePct,
    uint256 quoteTimestamp,
    bytes memory message
  ) external payable;
}

contract HemDealerCrossChain is Ownable, ReentrancyGuard {
  HemDealer public hemDealer;
  address public acrossRouter;
  mapping(uint256 => bool) public crossChainTransferPending;
  mapping(uint256 => uint256) public sourceChainIds;
  mapping(bytes32 => uint256) public transferHashes;
  mapping(bytes32 => bool) public processedMessages;

  uint256 public constant MAX_SLIPPAGE = 50; // 0.5% max slippage
  uint256 public constant TRANSFER_TIMEOUT = 24 hours;
  mapping(uint256 => uint256) public transferInitiatedAt;

  ISpokePool public immutable spokePool;

  event CrossChainTransferInitiated(
    uint256 indexed carId,
    uint256 sourceChainId,
    uint256 destinationChainId,
    address indexed seller,
    address indexed buyer
  );
  event CrossChainTransferCompleted(
    uint256 indexed carId,
    uint256 destinationChainId,
    address indexed newOwner
  );
  event TransferCancelled(uint256 indexed carId, address indexed owner);

  constructor(address _hemDealer, address _spokePool, address _acrossRouter) {
    require(_spokePool != address(0), 'Invalid SpokePool');
    require(_acrossRouter != address(0), 'Invalid Across Router');
    spokePool = ISpokePool(_spokePool);
    hemDealer = HemDealer(_hemDealer);
    acrossRouter = _acrossRouter;
  }

  function isSupportedToken(address token) public pure returns (bool) {
    return token == address(0);
  }

  function initiateCrossChainTransfer(
    uint256 carId,
    uint256 targetChainId,
    uint256 relayerFeePct,
    uint256 quoteTimestamp
  ) public payable {
    require(!crossChainTransferPending[carId], 'Transfer already pending');
    require(targetChainId != block.chainid, 'Same chain transfer not allowed');

    HemDealer.CarStruct memory car = hemDealer.getCar(carId);
    require(msg.sender == car.owner, 'Not car owner');

    // Pack car transfer data into message for the bridge
    bytes memory transferData = abi.encode(
      carId,
      car.owner,
      block.chainid,
      car.price,
      car.seller
    );

    // Call Across Protocol's deposit function
    spokePool.deposit{value: msg.value}(
      uint32(targetChainId),
      address(this),
      address(0),
      msg.value,
      relayerFeePct,
      quoteTimestamp,
      transferData
    );

    // Update state
    crossChainTransferPending[carId] = true;
    transferInitiatedAt[carId] = block.timestamp;
    sourceChainIds[carId] = block.chainid;

    emit CrossChainTransferInitiated(
      carId,
      block.chainid,
      targetChainId,
      car.owner,
      car.seller.wallet
    );
  }

  function receiveCrossChainTransfer(bytes memory message, uint256 sourceChainId) public {
    require(msg.sender == acrossRouter, 'Only router can call');

    // First decode just the messageHash
    (bytes32 messageHash, ) = abi.decode(message, (bytes32, bytes));
    require(verifyMessage(messageHash), 'Invalid message');
    require(!processedMessages[messageHash], 'Message already processed');
    processedMessages[messageHash] = true;

    // Decode full message
    (
      ,
      // skip messageHash since we already have it
      uint256 carId,
      address originalOwner,
      uint256 originalChainId,
      uint256 price,
      HemDealer.SellerDetails memory seller
    ) = abi.decode(message, (bytes32, uint256, address, uint256, uint256, HemDealer.SellerDetails));

    HemDealer.CarStruct memory originalCar = hemDealer.getCar(carId);

    // Create car details for the new chain
    HemDealer.CarBasicDetails memory basicDetails = HemDealer.CarBasicDetails({
      name: originalCar.name,
      images: originalCar.images,
      description: originalCar.description,
      make: originalCar.make,
      model: originalCar.model,
      year: originalCar.year,
      vin: originalCar.vin
    });

    HemDealer.CarTechnicalDetails memory technicalDetails = HemDealer.CarTechnicalDetails({
      mileage: originalCar.mileage,
      color: originalCar.color,
      condition: originalCar.condition,
      transmission: originalCar.transmission,
      fuelType: originalCar.fuelType,
      price: price
    });

    HemDealer.CarAdditionalInfo memory additionalInfo = HemDealer.CarAdditionalInfo({
      location: originalCar.location,
      carHistory: '',
      features: originalCar.features
    });

    // List the car on the new chain
    hemDealer.listCar(
      basicDetails,
      technicalDetails,
      additionalInfo,
      seller,
      block.chainid,
      originalCar.paymentToken
    );

    emit CrossChainTransferCompleted(carId, block.chainid, originalOwner);
  }

  function cancelTimedOutTransfer(uint256 carId) external {
    require(crossChainTransferPending[carId], 'No pending transfer');
    require(
      block.timestamp > transferInitiatedAt[carId] + TRANSFER_TIMEOUT,
      'Transfer not timed out'
    );

    HemDealer.CarStruct memory car = hemDealer.getCar(carId);
    require(msg.sender == car.owner || msg.sender == owner(), 'Not authorized');

    crossChainTransferPending[carId] = false;
    delete transferInitiatedAt[carId];
    delete sourceChainIds[carId];

    emit TransferCancelled(carId, car.owner);
  }

  function bridgePayment(
    uint256 amount,
    address recipient,
    uint256 destinationChainId,
    uint256 relayerFeePct,
    uint256 quoteTimestamp
  ) external payable nonReentrant {
    require(msg.value == amount, 'Incorrect payment amount');

    spokePool.deposit{value: msg.value}(
      uint32(destinationChainId),
      recipient,
      address(0), // native token
      amount,
      relayerFeePct,
      quoteTimestamp,
      '' // empty message for simple payments
    );
  }

  function verifyMessage(bytes32 messageHash) internal view returns (bool) {
    return IAcrossMessageVerifier(acrossRouter).verifyMessageFromAcross(messageHash);
  }

  receive() external payable {}

  function isTransferTimedOut(uint256 carId) public view returns (bool) {
    return block.timestamp > transferInitiatedAt[carId] + TRANSFER_TIMEOUT;
  }

  function validateQuote(
    uint256 amount,
    uint256 relayerFeePct,
    uint256 quoteTimestamp
  ) public view returns (bool) {
    require(block.timestamp - quoteTimestamp <= 5 minutes, "Quote expired");
    require(relayerFeePct <= MAX_SLIPPAGE, "Slippage too high");
    return true;
  }
}
