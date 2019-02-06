const RefundList = artifacts.require("RefundList");
const utils = require('./helpers/Utils.js');

contract("Refund List", function(accounts) {

    let owner = accounts[0];
    let alice = accounts[1];
    let bob = accounts[2];
    let refund;

    beforeEach('deploy contract list', async () => {
        refund = await RefundList.new();
    });

    it("Should deploy contract", async () => {
        let ownedBy = await refund.owner();
        ownedBy;
        assert.equal(await refund.owner(), owner)
    });

    it("Should add account to list", async () => {
        const addedAddress = await refund.addAddress(alice);
        const logs = addedAddress.logs[0];

        assert.equal(logs.event, "RefundStatus")
        assert.equal(logs.args.account, alice);
        assert.isTrue(logs.args.refund);
        assert.isTrue(await refund.getAddressStatus(alice))
    });

    it("Should remove account from list", async () => {
        await refund.addAddress(alice);
        const removed = await refund.removeAddress(alice);
        const logs = removed.logs[0];

        assert.equal(logs.event, "RefundStatus")
        assert.equal(logs.args.account, alice);
        assert.isFalse(logs.args.refund);
        assert.isFalse(await refund.getAddressStatus(alice))
    });

    it("Should only make changes for owner", async () => {
        let error;
        try {
            await refund.addAddress(alice, {from: bob});
        } catch (e) {
            error = e;
        }
        utils.ensureException(error);

        let error2;
        try {
            await refund.addAddress(alice);
            await refund.removeAddress(alice, {from: bob});
        } catch (e) {
            error2 = e;
        }
        utils.ensureException(error2);
    })
})