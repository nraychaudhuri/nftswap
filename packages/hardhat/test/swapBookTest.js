const { use, expect } = require("chai");
const { ethers } = require("hardhat");
const { solidity } = require("ethereum-waffle");
const { BigNumber } = require("@ethersproject/bignumber");

// const {
//     BN,           // Big Number support
//     constants,    // Common constants, like the zero address and largest integers
//     expectEvent,  // Assertions for emitted events
//     expectRevert, // Assertions for transactions that should fail
// } = require('@openzeppelin/test-helpers');

// use(solidity);

describe("SwapBook", function () {
    let book;
    let bookAddress;
    let ownerAddress, requestorAddress, receiverAddress;
    let nilToken;
    let ownerNfts = [];
    let requestorNfts = [];
    let receiverNfts = [];
    let owner, requestor, receiver;


    const mintNil = async (address) => {
        const txn = await nilToken.mintNil(address, "uri to asset");
        const receipt = await txn.wait();
        //getting the transfer event
        //Transfer(address(0), to, tokenId)
        return receipt.events[0].args[2].toString();
    }

    const assignTokens = async (nftAddress, ownerAddress, requestorAddress, receiverAddress) => {
        const ownerNfts = [], requestorNfts = [], receiverNfts = [];

        const tokenId1 = await mintNil(requestorAddress);
        const tokenId2 = await mintNil(requestorAddress);
        requestorNfts.push({ address: nftAddress, tokenId: tokenId1 })
        requestorNfts.push({ address: nftAddress, tokenId: tokenId2 })

        const tokenId3 = await mintNil(receiverAddress);
        const tokenId4 = await mintNil(receiverAddress);
        receiverNfts.push({ address: nftAddress, tokenId: tokenId3 })
        receiverNfts.push({ address: nftAddress, tokenId: tokenId4 })

        const tokenId5 = await mintNil(ownerAddress);
        const tokenId6 = await mintNil(ownerAddress);
        ownerNfts.push({ address: nftAddress, tokenId: tokenId5 })
        ownerNfts.push({ address: nftAddress, tokenId: tokenId6 })

        return [ownerNfts, requestorNfts, receiverNfts];
    }

    const approveContract = async (nftOwner, toAddress, tokenId) => {
        const approveTxn = await nilToken.connect(nftOwner).approve(toAddress, tokenId);
        await approveTxn.wait();
    }

    beforeEach(async () => {
        const SwapBook = await ethers.getContractFactory("SwapBook");
        const bookTxn = await SwapBook.deploy();
        book = await bookTxn.deployed();
        bookAddress = book.address;

        [owner, requestor, receiver] = await ethers.getSigners();
        requestorAddress = await requestor.getAddress();
        receiverAddress = await receiver.getAddress();
        ownerAddress = await owner.getAddress();

        const NilToken = await ethers.getContractFactory("NilToken");
        const nilTokenTxn = await NilToken.deploy();
        nilToken = await nilTokenTxn.deployed();

        [ownerNfts, requestorNfts, receiverNfts] = await assignTokens(nilToken.address, ownerAddress, requestorAddress, receiverAddress);

    });

    it("request swap fail if contract is not approved for the requestor nft", async function () {
        const txn = await book
            .connect(requestor)
            .requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId)
            .catch(error => error);

        expect(txn.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Contract needs to be approved before swap can be requested'");

    });

    it("request swap", async function () {
        const approveTxn = await nilToken.connect(requestor).approve(bookAddress, requestorNfts[0].tokenId);
        await approveTxn.wait();
        const approvedAddress = await nilToken.getApproved(requestorNfts[0].tokenId);
        expect(approvedAddress).to.equal(bookAddress);

        const txn = await book
            .connect(requestor)
            .requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        const contractReceipt = await txn.wait();

        expect(contractReceipt.events.length).to.equal(1)
        expect(contractReceipt.events[0].event).to.equal("SwapRequested");
        expect(contractReceipt.events[0].args[0]).to.equal(requestorAddress);
        expect(contractReceipt.events[0].args[1]).to.equal(receiverAddress);
        expect(contractReceipt.events[0].args[2]).to.equal(BigNumber.from("1"));
    });


    it("Get all the swap offers made to an address", async function () {
        //approve contract for initiating the swap
        await approveContract(requestor, bookAddress, requestorNfts[0].tokenId);
        await approveContract(requestor, bookAddress, requestorNfts[1].tokenId);

        const txn = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        await txn.wait();
        const txn1 = await book.connect(requestor).requestSwap(requestorNfts[1].address, requestorNfts[1].tokenId, receiverAddress, receiverNfts[1].address, receiverNfts[1].tokenId);
        await txn1.wait();

        await approveContract(owner, bookAddress, ownerNfts[0].tokenId);
        const txn2 = await book.connect(owner).requestSwap(ownerNfts[0].address, ownerNfts[0].tokenId, receiverAddress, receiverNfts[1].address, receiverNfts[1].tokenId);
        await txn2.wait();

        const offers = await book.offersReceived(receiverAddress);
        expect(offers.length).to.equal(3);
        const offer1 = await book.getOffer(offers[0]);
        const offer2 = await book.getOffer(offers[1]);
        const offer3 = await book.getOffer(offers[2]);
        expect(offer1.requestorAddress.toLowerCase()).to.equal(requestorAddress.toLowerCase())
        expect(offer2.requestorAddress.toLowerCase()).to.equal(requestorAddress.toLowerCase())
        expect(offer3.requestorAddress.toLowerCase()).to.equal(ownerAddress.toLowerCase())

        expect(offer1.requestorNft.toLowerCase()).to.equal(requestorNfts[0].address.toLowerCase())
        expect(offer1.requestorNftId).to.equal(requestorNfts[0].tokenId)
        expect(offer2.requestorNftId).to.equal(requestorNfts[1].tokenId)
        expect(offer3.requestorNftId).to.equal(ownerNfts[0].tokenId)
    });

    it("Get all swap requests made from an address", async function () {

        await approveContract(requestor, bookAddress, requestorNfts[0].tokenId);
        await approveContract(owner, bookAddress, ownerNfts[0].tokenId);
        //send two offers
        const txn = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        await txn.wait();
        const txn1 = await book.connect(owner).requestSwap(ownerNfts[0].address, ownerNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        await txn1.wait();

        const swapRequests = await book.swapRequestsMade(requestorAddress);
        expect(swapRequests.length).to.equal(1);
        const offer1 = await book.getOffer(swapRequests[0]);

        expect(offer1.receiverAddress.toLowerCase()).to.equal(receiverAddress.toLowerCase())

        const swapRequests1 = await book.swapRequestsMade(ownerAddress);
        expect(swapRequests1.length).to.equal(1);
        const offer2 = await book.getOffer(swapRequests1[0]);
        expect(offer2.receiverAddress.toLowerCase()).to.equal(receiverAddress.toLowerCase())

        const swapRequests2 = await book.swapRequestsMade(receiverAddress);
        expect(swapRequests2.length).to.equal(0);
    });

    it("Make sure the requestor owns the nft before placing the swap", async function () {
        const txn = await book
            .connect(requestor)
            .requestSwap(ownerNfts[0].address, ownerNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId)
            .catch(error => error);
        expect(txn.message).to.equal("VM Exception while processing transaction: reverted with reason string 'You are not the owner of the NFT you want to exchange'");
    });

    it("Make sure the receiver owns the nft before placing the swap", async function () {
        const txn = await book
            .connect(requestor)
            .requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, ownerNfts[0].address, ownerNfts[0].tokenId)
            .catch(error => error);
        expect(txn.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Receiver no longer owns the NFT you want to exchange'");
    });


    it("Fail for invalid requestor nft address", async function () {
        const txn = await book
            .connect(requestor)
            .requestSwap(ethers.constants.AddressZero, "1", receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId)
            .catch(error => error);
        expect(txn.message).to.equal("Transaction reverted: function call to a non-contract account");
    });

    it("accept offer should fail if contract is not approved for receiver nft", async function () {
        approveContract(requestor, bookAddress, requestorNfts[0].tokenId);
        const txn1 = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        await txn1.wait();
        const offers = await book.offersReceived(receiverAddress);

        const txn = await book
            .connect(receiver)
            .acceptOffer(offers[0])
            .catch(error => error);

        expect(txn.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Contract needs to be approved before accepting the offer'");

    });

    it("Only receiver can accept offer", async function () {
        approveContract(requestor, bookAddress, requestorNfts[0].tokenId);
        const txn1 = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        await txn1.wait();
        const offers = await book.offersReceived(receiverAddress);

        const txn = await book
            .connect(owner)
            .acceptOffer(offers[0])
            .catch(error => error);

        expect(txn.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Only receiver of the offer can accept offer'");

    });

    it("throw error for invalid offer id", async function () {
        approveContract(requestor, bookAddress, requestorNfts[0].tokenId);
        const txn1 = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        await txn1.wait();
        const offers = await book.offersReceived(receiverAddress);

        const txn = await book
            .connect(receiver)
            .acceptOffer(BigNumber.from("42"))
            .catch(error => error);

        expect(txn.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Only receiver of the offer can accept offer'");
    });

    it("execute offer when both party approved the contract", async function () {
        approveContract(requestor, bookAddress, requestorNfts[0].tokenId);
        const txn1 = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        await txn1.wait();
        const offers = await book.offersReceived(receiverAddress);

        approveContract(receiver, bookAddress, receiverNfts[0].tokenId);
        const txn = await book.connect(receiver).acceptOffer(offers[0])
        const receipt = await txn.wait();
        expect(receipt.events.filter(e => e.event == "SwapCompleted").length).to.equal(1);

        //check the ownership change
        const newOwner1 = await nilToken.ownerOf(requestorNfts[0].tokenId);
        expect(newOwner1).to.equal(receiverAddress);
        const newOwner2 = await nilToken.ownerOf(receiverNfts[0].tokenId);
        expect(newOwner2).to.equal(requestorAddress);
        // const eventFilter = nilToken.filters.Transfer();
        // const events = await nilToken.queryFilter(eventFilter);
        // console.log("events ", events);
        // expect(receipt.events.length).to.equal(2);
        // expect(contractReceipt.events[0].event).to.equal("Transfer");
        // expect(contractReceipt.events[1].event).to.equal("Transfer");

    });

    it("Make sure contract has approval from both party at time of the offer execution", async function () {
        approveContract(requestor, bookAddress, requestorNfts[0].tokenId);
        const txn1 = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        await txn1.wait();
        const offers = await book.offersReceived(receiverAddress);

        //remove the approval
        approveContract(requestor, ownerAddress, requestorNfts[0].tokenId);

        approveContract(receiver, bookAddress, receiverNfts[0].tokenId);
        const txn = await book.connect(receiver).acceptOffer(offers[0]).catch(e => e);
        expect(txn.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Contract does not have the requestors approval at this time'");
    });
});