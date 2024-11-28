// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract HemDealer is Ownable, ReentrancyGuard, ERC721 {
  using Counters for Counters.Counter;
  using SafeERC20 for IERC20;

  Counters.Counter private _totalCars;
  Counters.Counter private _totalSales;

  mapping(uint256 => CarStruct) private cars;
  mapping(uint256 => SalesStruct[]) private sales;

  address public acrossRouter;
  mapping(address => bool) public supportedTokens;
  mapping(uint256 => uint256) public destinationChainIds;

  mapping(uint256 => bool) public crossChainTransferPending;
  mapping(uint256 => uint256) public sourceChainIds;
  mapping(bytes32 => uint256) public transferHashes;

  struct CarStruct {
    uint256 id;
    address owner;
    string name;
    string[] images;
    string description;
    string make;
    string model;
    uint256 year;
    uint256 vin;
    uint256 mileage;
    string color;
    CarCondition condition;
    CarTransmission transmission;
    FuelType fuelType;
    uint256 price;
    string location;
    string[] features;
    SellerDetails seller;
    bool sold;
    bool deleted;
    uint256 destinationChainId;
    address paymentToken;
    uint256 sourceChainId;
  }

  enum CarCondition {
    New,
    Used,
    CertifiedPreOwned
  }
  enum CarTransmission {
    Manual,
    Automatic
  }
  enum FuelType {
    Gasoline,
    Diesel,
    Electric,
    Hybrid
  }

  struct SalesStruct {
    uint256 id;
    uint256 newCarId;
    uint256 price;
    address owner;
  }

  struct SellerDetails {
    address wallet;
    string sellerName;
    string email;
    uint256 phoneNumber;
    string profileImage;
  }

  struct CarBasicDetails {
    string name;
    string[] images;
    string description;
    string make;
    string model;
    uint256 year;
    uint256 vin;
  }

  struct CarTechnicalDetails {
    uint256 mileage;
    string color;
    CarCondition condition;
    CarTransmission transmission;
    FuelType fuelType;
    uint256 price;
  }

  struct CarAdditionalInfo {
    string location;
    string carHistory;
    string[] features;
  }

  event CarListed(uint256 indexed carId, address indexed seller, uint256 price);
  event CarSold(
    uint256 indexed carId,
    address indexed seller,
    address indexed buyer,
    uint256 price
  );
  event CarUpdated(uint256 indexed carId, address indexed owner);
  event CarDeleted(uint256 indexed carId, address indexed owner);
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

  constructor(address _acrossRouter) ERC721('HemDealer', 'HDM') {
    require(msg.sender != address(0), 'Invalid deployer');
    require(_acrossRouter != address(0), 'Invalid router');
    acrossRouter = _acrossRouter;
  }

  function addSupportedToken(address token) external onlyOwner {
    require(token != address(0), 'Invalid token');
    supportedTokens[token] = true;
  }

  function removeSupportedToken(address token) external onlyOwner {
    supportedTokens[token] = false;
  }

  function listCar(
    CarBasicDetails calldata basicDetails,
    CarTechnicalDetails calldata technicalDetails,
    CarAdditionalInfo calldata additionalInfo,
    SellerDetails calldata sellerDetails,
    uint256 destinationChainId,
    address paymentToken
  ) public nonReentrant {
    require(supportedTokens[paymentToken], 'Unsupported payment token');
    require(
      msg.sender == sellerDetails.wallet && sellerDetails.wallet != address(0),
      'Invalid seller'
    );
    require(technicalDetails.price > 0, 'Invalid price');
    require(basicDetails.images.length > 0, 'No images');
    require(basicDetails.year <= block.timestamp / 365 days + 1970, 'Invalid year');
    require(technicalDetails.mileage < 1_000_000_000, 'Invalid mileage');

    _totalCars.increment();
    uint256 newCarId = _totalCars.current();

    cars[newCarId] = CarStruct(
      newCarId,
      msg.sender,
      basicDetails.name,
      basicDetails.images,
      basicDetails.description,
      basicDetails.make,
      basicDetails.model,
      basicDetails.year,
      basicDetails.vin,
      technicalDetails.mileage,
      technicalDetails.color,
      technicalDetails.condition,
      technicalDetails.transmission,
      technicalDetails.fuelType,
      technicalDetails.price,
      additionalInfo.location,
      additionalInfo.features,
      sellerDetails,
      false,
      false,
      destinationChainId,
      paymentToken,
      0
    );

    destinationChainIds[newCarId] = destinationChainId;

    _safeMint(msg.sender, newCarId);
    emit CarListed(newCarId, msg.sender, technicalDetails.price);
  }

  modifier onlyCarOwner(uint256 carId) {
    require(cars[carId].owner == msg.sender || owner() == msg.sender, 'Unauthorized');
    _;
  }

  modifier carExists(uint256 carId) {
    require(cars[carId].owner != address(0), 'Car does not exist');
    require(!cars[carId].deleted, 'Car has been deleted');
    _;
  }

  function updateCar(
    uint256 newCarId,
    CarBasicDetails memory basicDetails,
    CarTechnicalDetails memory technicalDetails,
    CarAdditionalInfo memory additionalInfo,
    SellerDetails memory sellerDetails
  ) public nonReentrant onlyCarOwner(newCarId) {
    require(technicalDetails.price > 0, 'Price must be greater than 0');
    require(bytes(basicDetails.name).length > 0, 'Name cannot be empty');
    require(basicDetails.images.length > 0, 'At least one image is required');
    require(bytes(basicDetails.make).length > 0, 'Make cannot be empty');
    require(bytes(basicDetails.model).length > 0, 'Model cannot be empty');

    require(sellerDetails.wallet == cars[newCarId].seller.wallet, 'Cannot change seller wallet');
    require(msg.sender == sellerDetails.wallet, 'Seller wallet must match sender');

    cars[newCarId] = CarStruct(
      newCarId,
      msg.sender,
      basicDetails.name,
      basicDetails.images,
      basicDetails.description,
      basicDetails.make,
      basicDetails.model,
      basicDetails.year,
      basicDetails.vin,
      technicalDetails.mileage,
      technicalDetails.color,
      technicalDetails.condition,
      technicalDetails.transmission,
      technicalDetails.fuelType,
      technicalDetails.price,
      additionalInfo.location,
      additionalInfo.features,
      sellerDetails,
      cars[newCarId].sold,
      false,
      cars[newCarId].destinationChainId,
      cars[newCarId].paymentToken,
      cars[newCarId].sourceChainId
    );
    emit CarUpdated(newCarId, msg.sender);
  }

  function deleteCar(uint256 newCarId) public nonReentrant onlyCarOwner(newCarId) {
    require(!cars[newCarId].deleted, 'Car already deleted');
    cars[newCarId].deleted = true;
    _burn(newCarId);
    emit CarDeleted(newCarId, msg.sender);
  }

  // View Functions
  function getCar(uint256 newCarId) public view carExists(newCarId) returns (CarStruct memory) {
    return cars[newCarId];
  }

  function getAllCars() public view returns (CarStruct[] memory) {
    uint256 availableCars;
    for (uint256 i = 1; i <= _totalCars.current(); i++) {
      if (!cars[i].deleted) {
        availableCars++;
      }
    }

    CarStruct[] memory allCars = new CarStruct[](availableCars);
    uint256 index;
    for (uint256 i = 1; i <= _totalCars.current(); i++) {
      if (!cars[i].deleted) {
        allCars[index++] = cars[i];
      }
    }
    return allCars;
  }

  function getMyCars() public view returns (CarStruct[] memory) {
    uint256 availableCars;
    for (uint256 i = 1; i <= _totalCars.current(); i++) {
      if (!cars[i].deleted && cars[i].owner == msg.sender) {
        availableCars++;
      }
    }

    CarStruct[] memory myCars = new CarStruct[](availableCars);
    uint256 index;
    for (uint256 i = 1; i <= _totalCars.current(); i++) {
      if (!cars[i].deleted && cars[i].owner == msg.sender) {
        myCars[index++] = cars[i];
      }
    }
    return myCars;
  }

  function getAllSales() public view returns (SalesStruct[] memory) {
    uint256 totalSalesCount = 0;

    for (uint256 i = 1; i <= _totalCars.current(); i++) {
      totalSalesCount += sales[i].length;
    }

    SalesStruct[] memory Sales = new SalesStruct[](totalSalesCount);
    uint256 index = 0;

    for (uint256 i = 1; i <= _totalCars.current(); i++) {
      for (uint256 j = 0; j < sales[i].length; j++) {
        Sales[index] = sales[i][j];
        index++;
      }
    }
    return Sales;
  }

  function buyCar(uint256 carId) public payable nonReentrant carExists(carId) {
    CarStruct storage car = cars[carId];
    require(!car.sold && msg.sender != car.owner, 'Invalid purchase');

    if (car.paymentToken == address(0)) {
      require(msg.value == car.price, 'Incorrect payment');

      // Bridge ETH to destination chain
      (bool success, ) = acrossRouter.call{ value: msg.value }(
        abi.encodeWithSignature(
          'deposit(address,uint256,uint256)',
          car.seller.wallet,
          car.destinationChainId,
          0 // Min amount out
        )
      );
      require(success, 'Bridge transfer failed');
    } else {
      require(msg.value == 0, 'ETH not accepted');
      IERC20 token = IERC20(car.paymentToken);

      // Transfer tokens from buyer to this contract
      token.safeTransferFrom(msg.sender, address(this), car.price);

      // Approve router to spend tokens
      token.safeApprove(acrossRouter, car.price);

      // Bridge tokens to destination chain
      (bool success, ) = acrossRouter.call(
        abi.encodeWithSignature(
          'depositERC20(address,address,uint256,uint256,uint256)',
          car.paymentToken,
          car.seller.wallet,
          car.price,
          car.destinationChainId,
          0 // Min amount out
        )
      );
      require(success, 'Bridge transfer failed');
    }

    if (car.destinationChainId != block.chainid) {
      // Initiate cross-chain transfer if buyer is on different chain
      initiateCrossChainTransfer(carId, car.destinationChainId);
    } else {
      // Regular same-chain transfer
      car.sold = true;
      car.owner = msg.sender;
      _transfer(car.seller.wallet, msg.sender, carId);
    }

    _totalSales.increment();
    sales[carId].push(
      SalesStruct({
        id: _totalSales.current(),
        newCarId: carId,
        price: car.price,
        owner: msg.sender
      })
    );

    emit CarSold(carId, car.seller.wallet, msg.sender, car.price);
  }

  function payTo(address to, uint256 price) internal {
    require(to != address(0), 'Cannot pay to zero address');
    (bool success, ) = payable(to).call{ value: price }('');
    require(success, 'Transfer failed');
  }

  function initiateCrossChainTransfer(
    uint256 carId,
    uint256 targetChainId
  ) public onlyCarOwner(carId) {
    require(!crossChainTransferPending[carId], 'Transfer already pending');
    require(targetChainId != block.chainid, 'Same chain transfer not allowed');

    CarStruct storage car = cars[carId];

    // Create transfer message
    bytes memory message = abi.encode(carId, car.owner, block.chainid, car.price, car.seller);

    // Send message to target chain via Across router
    (bool success, ) = acrossRouter.call(
      abi.encodeWithSignature('sendMessage(uint256,bytes)', targetChainId, message)
    );
    require(success, 'Failed to initiate transfer');

    // Mark transfer as pending
    crossChainTransferPending[carId] = true;
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

    // Decode transfer message
    (
      uint256 carId,
      address originalOwner,
      uint256 originalChainId,
      uint256 price,
      SellerDetails memory seller
    ) = abi.decode(message, (uint256, address, uint256, uint256, SellerDetails));

    // Create new car entry on this chain
    _totalCars.increment();
    uint256 newCarId = _totalCars.current();

    // Copy car details from message
    cars[newCarId] = CarStruct({
      id: newCarId,
      owner: originalOwner,
      name: cars[carId].name,
      images: cars[carId].images,
      description: cars[carId].description,
      make: cars[carId].make,
      model: cars[carId].model,
      year: cars[carId].year,
      vin: cars[carId].vin,
      mileage: cars[carId].mileage,
      color: cars[carId].color,
      condition: cars[carId].condition,
      transmission: cars[carId].transmission,
      fuelType: cars[carId].fuelType,
      price: price,
      location: cars[carId].location,
      features: cars[carId].features,
      seller: seller,
      sold: false,
      deleted: false,
      destinationChainId: block.chainid,
      paymentToken: cars[carId].paymentToken,
      sourceChainId: originalChainId
    });

    emit CrossChainTransferCompleted(newCarId, block.chainid, originalOwner);
  }
}
