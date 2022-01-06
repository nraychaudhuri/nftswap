pragma solidity >=0.8.0 <0.9.0;

//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

library SwapLib {
    struct Offer {
        address requestorAddress;
        address requestorNft;
        uint256 requestorNftId;
        address receiverAddress;
        address receiverNft;
        uint256 receiverNftId;
        bool isAccepted;
    }

    function getRequestorNft(Offer memory offer)
        internal
        pure
        returns (ERC721)
    {
        return ERC721(offer.requestorNft);
    }

    function getReceiverNft(Offer memory offer) internal pure returns (ERC721) {
        return ERC721(offer.receiverNft);
    }

    function isOpen(Offer memory offer) internal pure returns (bool) {
        return !offer.isAccepted;
    }

    function accept(Offer memory offer) internal returns (Offer memory) {
        getRequestorNft(offer).transferFrom(
            offer.requestorAddress,
            offer.receiverAddress,
            offer.requestorNftId
        );
        getReceiverNft(offer).transferFrom(
            msg.sender,
            offer.requestorAddress,
            offer.receiverNftId
        );
        offer.isAccepted = true;
        return offer;
    }

    function createOffer(
        address requestorNftAddress,
        uint256 requestorNftId,
        address receiverAddress,
        address receiverNftAddress,
        uint256 receiverNftId
    ) internal view returns (Offer memory) {
        return
            Offer(
                msg.sender,
                requestorNftAddress,
                requestorNftId,
                receiverAddress,
                receiverNftAddress,
                receiverNftId,
                false
            );
    }
}
