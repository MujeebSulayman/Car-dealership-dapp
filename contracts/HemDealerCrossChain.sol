// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import './HemDealer.sol';

contract HemDealerCrossChain is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  HemDealer public hemDealer;
  address public acrossRouter;
  mapping(address => bool) public supportedTokens;
  mapping(uint256 => bool) public crossChainTransferPending;
  mapping(uint256 => uint256) public sourceChainIds;
  mapping(bytes32 => uint256) public transferHashes;
  mapping(bytes32 => bool) public processedMessages;

  uint256 public constant MAX_SLIPPAGE = 50; // 0.5% max slippage
  uint256 public constant TRANSFER_TIMEOUT = 24 hours;
  mapping(uint256 => uint256) public transferInitiatedAt;

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

  constructor(address _hemDealer, address _acrossRouter) {
    require(_hemDealer != address(0), 'Invalid HemDealer address');
    require(_acrossRouter != address(0), 'Invalid router address');
    hemDealer = HemDealer(_hemDealer);
    acrossRouter = _acrossRouter;
  }

  function addSupportedToken(address token) external onlyOwner {
    require(token != address(0), 'Invalid token');
    supportedTokens[token] = true;
  }

  function removeSupportedToken(address token) external onlyOwner {
    supportedTokens[token] = false;
  }

  function isSupportedToken(address token) public view returns (bool) {
    if (token == address(0)) {
      return true;
    }
    return supportedTokens[token];
  }

  function initiateCrossChainTransfer(uint256 carId, uint256 targetChainId) public {
    require(!crossChainTransferPending[carId], 'Transfer already pending');
    require(targetChainId != block.chainid, 'Same chain transfer not allowed');

    HemDealer.CarStruct memory car = hemDealer.getCar(carId);
    require(msg.sender == car.owner, 'Not car owner');

    // Create transfer message with nonce for uniqueness
    bytes32 messageHash = keccak256(
      abi.encodePacked(
        carId,
        car.owner,
        block.chainid,
        car.price,
        car.seller.wallet,
        car.seller.sellerName,
        car.seller.email,
        car.seller.phoneNumber,
        car.seller.profileImage,
        block.timestamp
      )
    );

    bytes memory message = abi.encode(
      messageHash,
      carId,
      car.owner,
      block.chainid,
      car.price,
      car.seller
    );

    // Send message to target chain via Across router
    (bool success, ) = acrossRouter.call(
      abi.encodeWithSignature('sendMessage(uint256,bytes)', targetChainId, message)
    );
    require(success, 'Failed to initiate transfer');

    // Mark transfer as pending with timestamp
    crossChainTransferPending[carId] = true;
    transferInitiatedAt[carId] = block.timestamp;
    sourceChainIds[carId] = block.chainid;
    transferHashes[messageHash] = carId;

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

    // Decode transfer message
    (
      bytes32 messageHash,
      uint256 carId,
      address originalOwner,
      uint256 originalChainId,
      uint256 price,
      HemDealer.SellerDetails memory seller
    ) = abi.decode(message, (bytes32, uint256, address, uint256, uint256, HemDealer.SellerDetails));

    require(!processedMessages[messageHash], 'Message already processed');
    processedMessages[messageHash] = true;

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
    address token,
    uint256 amount,
    address recipient,
    uint256 destinationChainId
  ) external payable {
    require(supportedTokens[token] || token == address(0), 'Unsupported token');

    if (token == address(0)) {
      require(msg.value == amount, 'Incorrect payment');
      uint256 minAmountOut = (amount * (10000 - MAX_SLIPPAGE)) / 10000;

      (bool success, ) = acrossRouter.call{ value: msg.value }(
        abi.encodeWithSignature(
          'deposit(address,uint256,uint256)',
          recipient,
          destinationChainId,
          minAmountOut
        )
      );
      require(success, 'Bridge transfer failed');
    } else {
      require(msg.value == 0, 'ETH not accepted');
      IERC20 tokenContract = IERC20(token);
      uint256 minAmountOut = (amount * (10000 - MAX_SLIPPAGE)) / 10000;

      tokenContract.safeTransferFrom(msg.sender, address(this), amount);
      tokenContract.safeApprove(acrossRouter, amount);

      (bool success, ) = acrossRouter.call(
        abi.encodeWithSignature(
          'depositERC20(address,address,uint256,uint256,uint256)',
          token,
          recipient,
          amount,
          destinationChainId,
          minAmountOut
        )
      );
      require(success, 'Bridge transfer failed');
      tokenContract.safeApprove(acrossRouter, 0);
    }
  }

  receive() external payable {}
}
