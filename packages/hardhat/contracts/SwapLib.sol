pragma solidity >=0.8.0 <0.9.0;

//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

library SwapLib {
    enum OfferStatus {
        Requested,
        Accepted,
        Cancelled
    }
    struct Offer {
        address requestorAddress;
        address requestorNft;
        uint256 requestorNftId;
        address receiverAddress;
        address receiverNft;
        uint256 receiverNftId;
        OfferStatus status;
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

    function cancelOffer(Offer memory offer)
        internal
        pure
        returns (Offer memory)
    {
        offer.status = OfferStatus.Cancelled;
        return offer;
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
        offer.status = OfferStatus.Accepted;
        return offer;
    }

    function requestOffer(
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
                OfferStatus.Requested
            );
    }
}
