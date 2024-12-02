// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import './HemDealerCrossChain.sol';

contract HemDealer is Ownable, ERC721 {
  using Counters for Counters.Counter;

  Counters.Counter private _totalCars;
  Counters.Counter private _totalSales;

  mapping(uint256 => CarStruct) private cars;
  mapping(uint256 => SalesStruct[]) private sales;

  HemDealerCrossChain public crossChainHandler;

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
  event CrossChainHandlerSet(address indexed handler);

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {
    require(msg.sender != address(0), 'Invalid deployer');
  }

  function setCrossChainHandler(address payable _handler) external onlyOwner {
    crossChainHandler = HemDealerCrossChain(_handler);
    emit CrossChainHandlerSet(_handler);
  }

  function listCar(
    CarBasicDetails calldata basicDetails,
    CarTechnicalDetails calldata technicalDetails,
    CarAdditionalInfo calldata additionalInfo,
    SellerDetails calldata sellerDetails,
    uint256 destinationChainId,
    address paymentToken
  ) public {
    require(paymentToken == address(0), 'Only native token supported');
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
  ) public {
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

  function deleteCar(uint256 newCarId) public {
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

  function buyCar(
    uint256 carId,
    uint256 relayerFeePct,
    uint256 quoteTimestamp
  ) public payable carExists(carId) {
    CarStruct storage car = cars[carId];
    require(!car.sold && msg.sender != car.owner, 'Invalid purchase');
    require(msg.value >= car.price, 'Insufficient payment');
    require(car.paymentToken == address(0), 'Only native token supported');

    if (car.destinationChainId != block.chainid) {
      // Cross-chain purchase
      crossChainHandler.bridgePayment{value: msg.value}(
        msg.value,
        car.seller.wallet,
        car.destinationChainId,
        relayerFeePct,
        quoteTimestamp
      );
      crossChainHandler.initiateCrossChainTransfer(
        carId, 
        car.destinationChainId,
        relayerFeePct,
        quoteTimestamp
      );
    } else {
      // Same-chain purchase
      car.sold = true;
      car.owner = msg.sender;
      _transfer(car.seller.wallet, msg.sender, carId);
      payTo(car.seller.wallet, msg.value);
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
}
