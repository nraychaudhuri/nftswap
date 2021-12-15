const { use, expect } = require("chai");
const { ethers } = require("hardhat");
const { solidity } = require("ethereum-waffle");

// const {
//     BN,           // Big Number support
//     constants,    // Common constants, like the zero address and largest integers
//     expectEvent,  // Assertions for emitted events
//     expectRevert, // Assertions for transactions that should fail
// } = require('@openzeppelin/test-helpers');

// use(solidity);

describe("SwapBook", function () {
    let book;
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

    const assignTokens = async (ownerAddress, requestorAddress, receiverAddress) => {
        const nftAddress = nilToken.address;
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

    }

    beforeEach(async () => {

        const SwapBook = await ethers.getContractFactory("SwapBook");
        book = await SwapBook.deploy();
        await book.deployed();

        [owner, requestor, receiver] = await ethers.getSigners();
        requestorAddress = await requestor.getAddress();
        receiverAddress = await receiver.getAddress();
        ownerAddress = await owner.getAddress();

        const NilToken = await ethers.getContractFactory("NilToken");
        nilToken = await NilToken.deploy();
        await nilToken.deployed();

        await assignTokens(ownerAddress, requestorAddress, receiverAddress);

    });

    it("request swap", async function () {
        const txn = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        const contractReceipt = await txn.wait();

        expect(contractReceipt.events.length).to.equal(1)
        expect(contractReceipt.events[0].event).to.equal("SwapRequested");
        expect(contractReceipt.events[0].args[0]).to.equal(requestorAddress);
        expect(contractReceipt.events[0].args[1]).to.equal(receiverAddress);
    });

    it("Get all the swap offers made to an address", async function () {
        //send two offers
        const txn = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
        await txn.wait();
        const txn1 = await book.connect(requestor).requestSwap(requestorNfts[1].address, requestorNfts[1].tokenId, receiverAddress, receiverNfts[1].address, receiverNfts[1].tokenId);
        await txn1.wait();
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


    // it("Receiver accepts an offer", async function () {
    //     //make two offers
    //     const txn = await book.connect(requestor).requestSwap(requestorNfts[0].address, requestorNfts[0].tokenId, receiverAddress, receiverNfts[0].address, receiverNfts[0].tokenId);
    //     await txn.wait();
    //     const txn = await book.connect(owner).requestSwap(ownerNfts[0].address, ownerNfts[0].tokenId, receiverAddress, receiverNfts[1].address, receiverNfts[1].tokenId);
    //     await txn.wait();

    //     await book.acceptOffer(offerId)
    // });

    // it("Should instantiate Vendor and transfer all the tokens", async function () {

    //     expect(await token.totalSupply()).to.equal("1000000000000000000000");
    //     expect(await token.balanceOf(vendor.address)).to.equal("0");
    //     const txn = await token.transfer(vendor.address, ethers.utils.parseEther("1000"));
    //     // wait until the transaction is mined
    //     await txn.wait();
    //     expect(await token.balanceOf(vendor.address)).to.equal("1000000000000000000000");
    // });
    // it("BuyTokens to should transfer 100 tokens to caller for one eth", async function () {
    //     //owner address deployed the contracts
    //     //otherAddress will be used buy tokens
    //     const [owner, other] = await ethers.getSigners();

    //     expect(await token.totalSupply()).to.equal("1000000000000000000000");
    //     expect(await token.balanceOf(other.address)).to.equal("0");
    //     expect(await token.balanceOf(vendor.address)).to.equal("0");

    //     console.log("Other address ", other.address)
    //     console.log("Wei ", ethers.utils.parseEther("1").toString())
    //     const txn = await vendor.buyTokens()
    //     await txn.wait();
    //     expect(await token.balanceOf(other.address)).to.equal("0");


    //     // const transactionHash = await owner.sendTransaction({
    //     //     to: "contract address",
    //     //     value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
    //     //   });
    // });
});