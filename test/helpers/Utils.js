function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

function ensureException(error) {
    console.log(isException(error), error);
    assert.isTrue(isException(error));
}

const promisify = (inner) =>
    new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    );

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
        jsonrpc: "2.0", 
        method: "evm_increaseTime", 
        params: [integer],
        id: 0,
    })  

    await advanceBlock();
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
    addPercent: addPercent,
    increaseTime: increaseTime,
    promisify: promisify
};
