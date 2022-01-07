import { getNFT } from "./NFTLoader";

export const queryOffersReceived = async (contract, address) => {
    const filter = contract?.filters.SwapRequested(null, address);
    const events = await contract?.queryFilter(filter);
    return events;
}

export const queryRequestsSent = async (contract, address) => {
    const filter = contract?.filters.SwapRequested(address);
    const events = await contract?.queryFilter(filter);
    return events;
}

export const notifyWhenSwapRequested = (contract, requestorAddress, callback) => {
    const filter = contract?.filters.SwapRequested(requestorAddress);
    contract?.once(filter, callback);
}

export const notifyWhenSwapCancelled = (contract, address, callback) => {
    const filter = contract?.filters.SwapCancelled(address);
    contract?.once(filter, callback);
}

export const notifyWhenSwapCompleted = (contract, address, callback) => {
    const filter = contract?.filters.SwapCompleted(null, address);
    contract?.once(filter, callback);
}

export const getOffers = async (address, contract, provider) => {
    const events = await queryOffersReceived(contract, address);
    if (events) {
        const offerIds = events.map(e => e.args.offerId)
        const promises = await offerIds?.map(async (element) => {
            return await getSwapOfferDetails(element, contract, provider);
        })
        const offers = await Promise.all(promises);
        return onlyOpenOffers(offers);
    }
    return [];
}

export const getRequests = async (address, contract, provider) => {
    const events = await queryRequestsSent(contract, address);
    if (events) {
        const offerIds = events.map(e => e.args.offerId)
        const promises = await offerIds?.map(async (element) => {
            return await getSwapOfferDetails(element, contract, provider);
            // return { offerId: element, otherNft: otherNft, myNft: userNft, status: status };
        })
        const offers = await Promise.all(promises);
        return onlyOpenOffers(offers);
    }
    return [];
}

const getSwapOfferDetails = async (offerId, contract, provider) => {
    const [requestorAddress, requestorNftAddress, requestorNftId, receiverAddress, receiverNftAddress, receiverNftId, status] =
        await contract.getOffer(offerId);
    const requestorNft = await getNFT(requestorNftAddress, requestorNftId, requestorAddress, provider);
    const receiverNft = await getNFT(receiverNftAddress, receiverNftId, receiverAddress, provider);
    return { offerId: offerId, requestorNft: requestorNft, receiverNft: receiverNft, status: status };
}

const onlyOpenOffers = (offers) => offers.filter(offer => offer.status == 0); //only return open swap offers

