pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SwapBook {
    struct Swap {
        address requestorAddress;
        address requestorNft;
        uint256 requestorNftId;
        address receiverAddress;
        address receiverNft;
        uint256 receiverNftId;
    }

    //TODO: Should optimize the space so we store swap object once

    //mapping of requestor to swap requests
    mapping(address => Swap[]) public requestorToSwap;
    //mapping of receiver to swap requests received
    mapping(address => Swap[]) public receiverToSwap;

    event SwapRequested(address indexed requestor, address indexed receiver);
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

    function requestSwap(
        address requestorNft,
        uint256 requestorNftId,
        address receiverAddress,
        address receiverNft,
        uint256 receiverNftId
    ) public {
        ERC721 token = ERC721(requestorNft);
        require(
            msg.sender == token.ownerOf(requestorNftId),
            "Not the owner of the NFT you want to swap"
        );

        Swap memory newSwap = Swap(
            msg.sender,
            requestorNft,
            requestorNftId,
            receiverAddress,
            receiverNft,
            receiverNftId
        );

        Swap[] storage swapsRequested = requestorToSwap[msg.sender];
        Swap[] storage swapsReceived = receiverToSwap[receiverAddress];
        swapsRequested.push(newSwap);
        swapsReceived.push(newSwap);

        requestorToSwap[msg.sender] = swapsRequested;
        receiverToSwap[receiverAddress] = swapsReceived;
        emit SwapRequested(msg.sender, receiverAddress);
    }

    function offersReceived(address receiver)
        public
        view
        returns (Swap[] memory)
    {
        return receiverToSwap[receiver];
    }

    function swapRequestsMade(address requestor)
        public
        view
        returns (Swap[] memory)
    {
        return requestorToSwap[requestor];
    }
}
