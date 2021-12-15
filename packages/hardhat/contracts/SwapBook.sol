pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SwapBook {
    struct SwapOffer {
        address requestorAddress;
        address requestorNft;
        uint256 requestorNftId;
        address receiverAddress;
        address receiverNft;
        uint256 receiverNftId;
    }
    using Counters for Counters.Counter;
    Counters.Counter private _offerIds;

    //mapping from id to swap offers
    mapping(uint256 => SwapOffer) public idToOffers;

    //mapping of requestor to swap requests
    mapping(address => uint256[]) public requestorToSwap;
    //mapping of receiver to swap requests received
    mapping(address => uint256[]) public receiverToSwap;

    event SwapRequested(
        address indexed requestor,
        address indexed receiver,
        uint256 indexed offerId
    );
    event SwapCompleted(
        address indexed requestor,
        address indexed receiver,
        uint256 indexed offerId
    );
    //Not sure yet what should be stored on-chain vs off-chain
    //requestSwap
    //view Offers
    //accept Offer
    //finalize swap
    //cancel offer

    string public purpose = "Building Unstoppable Apps!!!";

    constructor() {
        // what should we do on deploy?
    }

    // modifier onlyLINK() {
    //     require(msg.sender == address(LINK), "Must use LINK token");
    //     _;
    // }

    function requestSwap(
        address requestorNftAddress,
        uint256 requestorNftId,
        address receiverAddress,
        address receiverNftAddress,
        uint256 receiverNftId
    ) public {
        ERC721 requestorNFT = ERC721(requestorNftAddress);
        require(
            msg.sender == requestorNFT.ownerOf(requestorNftId),
            "You are not the owner of the NFT you want to exchange"
        );
        ERC721 receiverNFT = ERC721(receiverNftAddress);
        require(
            receiverAddress == receiverNFT.ownerOf(receiverNftId),
            "Receiver no longer owns the NFT you want to exchange"
        );
        require(
            address(this) == requestorNFT.getApproved(requestorNftId),
            "Contract needs to be approved before swap can be requested"
        );
        _offerIds.increment();
        uint256 id = _offerIds.current();

        SwapOffer memory offer = SwapOffer(
            msg.sender,
            requestorNftAddress,
            requestorNftId,
            receiverAddress,
            receiverNftAddress,
            receiverNftId
        );
        idToOffers[id] = offer;
        uint256[] storage swapsRequested = requestorToSwap[msg.sender];
        uint256[] storage swapsReceived = receiverToSwap[receiverAddress];
        swapsRequested.push(id);
        swapsReceived.push(id);
        requestorToSwap[msg.sender] = swapsRequested;
        receiverToSwap[receiverAddress] = swapsReceived;
        emit SwapRequested(msg.sender, receiverAddress, id);
    }

    function acceptOffer(uint256 offerId) public {
        SwapOffer memory offer = idToOffers[offerId];
        ERC721 requestorNFT = ERC721(offer.requestorNft);
        ERC721 receiverNFT = ERC721(offer.receiverNft);
        require(
            msg.sender == offer.receiverAddress,
            "Only receiver of the offer can accept offer"
        );
        require(
            address(this) == receiverNFT.getApproved(offer.receiverNftId),
            "Contract needs to be approved before accepting the offer"
        );
        require(
            address(this) == requestorNFT.getApproved(offer.requestorNftId),
            "Contract does not have the requestors approval at this time"
        );
        requestorNFT.transferFrom(
            offer.requestorAddress,
            offer.receiverAddress,
            offer.requestorNftId
        );
        receiverNFT.transferFrom(
            msg.sender,
            offer.requestorAddress,
            offer.receiverNftId
        );
        emit SwapCompleted(
            offer.requestorAddress,
            offer.receiverAddress,
            offerId
        );
    }

    function offersReceived(address receiver)
        public
        view
        returns (uint256[] memory)
    {
        return receiverToSwap[receiver];
    }

    function getOffer(uint256 offerId) public view returns (SwapOffer memory) {
        return idToOffers[offerId];
    }

    function swapRequestsMade(address requestor)
        public
        view
        returns (uint256[] memory)
    {
        return requestorToSwap[requestor];
    }
}
