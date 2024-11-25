// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract HemDealer is Ownable, ReentrancyGuard, ERC721 {
  constructor() ERC721('HemDealer', 'HDM') {}

  using Counters for Counters.Counters;

  Counters.Counters private _totalCars;

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
    string carHistory;
    string[] features;
    SellerDetails seller;
    CommentStruct[] comments;
  }

  struct SellerDetails {
    address wallet;
    string name;
    string contactInfo;
    string profileImage;
    string bio;
    uint256 reputation;
  }

  struct CommentStruct {
    address commenter;
    string comment;
    uint256 timestamp;
  }

  mapping(uint256 => CarStruct) cars;
  mapping(uint256 => SellerDetails) sellers;
  mapping(uint256 => CommentStruct[]) carComments;

  function listCar(
    string memory name,
    string[] memory images,
    string memory description,
    string memory make,
    string memory model,
    uint256 year,
    uint256 vin,
    uint256 mileage,
    string memory color,
    CarCondition condition,
    CarTransmission transmission,
    FuelType fuelType,
    uint256 price,
    string memory location,
    string memory carHistory,
    string[] memory features,
    SellerDetails memory seller
  ) public nonReentrant {
    require(seller.wallet != address(0), 'Invalid seller details');
    require(price > 0, 'Price must be greater than 0');
    require(bytes(name).length > 0, 'Name cannot be empty');
    require(bytes(description).length > 0, 'Description cannot be empty');
    require(images.length > 0, 'At least one image is required');

    _totalCars.increment();
    uint256 newCarId = _totalCars.current();

    cars[newCarId] = CarStruct(
      id: newCarId,
      owner: msg.sender,
      name: name,
      images: images,
      description: description,
      make: make,
      model: model,
      year: year,
      vin: vin,
      mileage: mileage,
      color: color,
      condition: condition,
      transmission: transmission,
      fuelType: fuelType,
      price: price,
      location: location,
      carHistory: carHistory,
      features: features,
      seller: seller,
      comments: new CommentStruct[](0)
    );

    _safeMint(msg.sender, newCarId);
  }

  function updateCar(uint256 carId, CarStruct memory newCar) public nonReentrant {
    require(cars[carId].owner == msg.sender || owner() == msg.sender, 'Only the owner can update this car');
    cars[carId] = newCar;  
  }

  function deleteCar(uint256 carId) public nonReentrant {
    require(cars[carId].owner == msg.sender || owner() == msg.sender, 'Only the owner can delete this car');
    _burn(carId);
    delete cars[carId];
  }

  
}

