function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

function ensureException(error) {
    assert(isException(error), error.toString());
}

function advanceBlock() {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_mine',
            id: Date.now(),
        }, (err, res) => {
            return err ? reject(err) : resolve(res)
        })
    })
}

async function increaseTime(integer) {

    await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [integer],
        id: 0,
    }, () => {});

    // Need to advance a block for changes to affect
    advanceBlock();
}

async function advanceToBlock(number) {
    if (web3.eth.blockNumber > number) {
        throw Error(`block number ${number} is in the past (current is ${web3.eth.blockNumber})`)
    }

    while (web3.eth.blockNumber < number) {
        await advanceBlock()
    }
}

// Find and add percentage to value
function addPercent(value, rate) {
    return (value + (value * rate / 100))
}

// Something for calculating numbers and padding

module.exports = {
    advanceToBlock: advanceToBlock,
    ensureException: ensureException,
    addPercent: addPercent
};
