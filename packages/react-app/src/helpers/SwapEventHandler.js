
export const queryOffersReceived = async (contract, address) => {
    const swapRequestEventFilter = contract?.filters.SwapRequested(null, address);
    const events = await contract?.queryFilter(swapRequestEventFilter);
    return events;
}

export const notifyWhenSwapRequested = (contract, requestorAddress, callback) => {
    const swapRequestEventFilter = contract?.filters.SwapRequested(requestorAddress);
    contract?.once(swapRequestEventFilter, callback);
}
