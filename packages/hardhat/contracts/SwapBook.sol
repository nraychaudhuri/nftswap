pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SwapLib.sol";

contract SwapBook is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _offerIds;
    using SwapLib for SwapLib.Offer;
    //mapping from id to swap offers
    mapping(uint256 => SwapLib.Offer) private idToOffers;

    event SwapRequested(
        address indexed requestor,
        address indexed receiver,
        uint256 offerId
    );
    event SwapCompleted(
        address indexed requestor,
        address indexed receiver,
        uint256 offerId
    );

    event SwapCancelled(address indexed requestor, uint256 offerId);

    //TODO: Setup owner specific controls
    //TODO: What happens when someone sends eth to the contract??

    constructor() {
        // what should we do on deploy?
    }

    function requestSwap(
        address requestorNftAddress,
        uint256 requestorNftId,
        address receiverAddress,
        address receiverNftAddress,
        uint256 receiverNftId
    ) public {
        SwapLib.Offer memory offer = SwapLib.requestOffer(
            requestorNftAddress,
            requestorNftId,
            receiverAddress,
            receiverNftAddress,
            receiverNftId
        );

        ERC721 requestorNFT = offer.getRequestorNft();
        require(
            msg.sender == requestorNFT.ownerOf(requestorNftId),
            "You are not the owner of the NFT you want to exchange"
        );
        ERC721 receiverNFT = offer.getReceiverNft();
        require(
            receiverAddress == receiverNFT.ownerOf(receiverNftId),
            "Receiver no longer owns the NFT you want to exchange"
        );
        require(
            address(this) == requestorNFT.getApproved(requestorNftId),
            "Contract needs to be approved before swap can be requested"
        );
        _offerIds.increment();
        uint256 offerId = _offerIds.current();

        idToOffers[offerId] = offer;
        emit SwapRequested(msg.sender, receiverAddress, offerId);
    }

    function acceptOffer(uint256 offerId) public {
        SwapLib.Offer memory offer = idToOffers[offerId];
        ERC721 requestorNFT = offer.getRequestorNft();
        ERC721 receiverNFT = offer.getReceiverNft();
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
        SwapLib.Offer memory acceptedOffer = offer.accept();
        idToOffers[offerId] = acceptedOffer;
        emit SwapCompleted(
            offer.requestorAddress,
            offer.receiverAddress,
            offerId
        );
    }

    function cancelOffer(uint256 offerId) public {
        SwapLib.Offer memory offer = getOffer(offerId);
        require(
            (msg.sender == offer.receiverAddress) ||
                (msg.sender == offer.requestorAddress),
            "You are not allowed to cancel the offer"
        );
        idToOffers[offerId] = offer.cancelOffer();

        emit SwapCancelled(msg.sender, offerId);
    }

    function getOffer(uint256 offerId)
        public
        view
        returns (SwapLib.Offer memory)
    {
        return idToOffers[offerId];
    }
}
