const SHA256 = require('crypto-js/sha256')
const BlockClass = require('./block.js')
const bitcoinMessage = require('bitcoinjs-message')

class Blockchain {
    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = []
        this.height = -1
        this.initializeChain()
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if (this.height === -1) {
            let block = new BlockClass.Block({ data: 'Genesis Block' })
            await this._addBlock(block)
        }
    }

    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height)
        })
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to
     * create the `block hash` and push the block into the chain array. Don't for get
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention
     * that this method is a private method.
     */
    _addBlock(block) {
        let self = this
        return new Promise(async (resolve, reject) => {
            try {
                const newHeight = self.height + 1
                block.height = newHeight
                if (newHeight > 0) {
                    block.previousBlockHash =
                        self.chain[self.chain.length - 1].hash
                }
                block.time = this._getCurrentTimeStamp()
                block.hash = SHA256(JSON.stringify(block)).toString()
                const errors = await this.validateChain()
                if (errors.length === 0) {
                    self.chain.push(block)
                    self.height++
                    resolve(block)
                } else {
                    reject(errors)
                }
                // reject("Genesis block wasn't created.")
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address
     */

    _getCurrentTimeStamp() {
        return parseInt(new Date().getTime().toString().slice(0, -3))
    }

    requestMessageOwnershipVerification(address) {
        let self = this
        return new Promise((resolve, reject) => {
            try {
                resolve(
                    `${address}:${self._getCurrentTimeStamp()}:starRegistry`
                )
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * @param {*} address
     * @param {*} message
     * @param {*} signature
     * @param {*} star
     */
    submitStar(address, message, signature, star) {
        let self = this
        return new Promise(async (resolve, reject) => {
            const timeFromMessage = parseInt(message.split(':')[1])
            const currentTime = self._getCurrentTimeStamp()
            const deltaTime = currentTime - timeFromMessage
            if (deltaTime <= 5 * 60) {
                if (bitcoinMessage.verify(message, address, signature)) {
                    const newBlock = new BlockClass.Block({
                        star: star,
                        owner: address
                    })
                    self._addBlock(newBlock)
                        .then((block) => resolve(block))
                        .catch((err) => reject(err))
                }
            } else {
                reject('Error: time passed 5 minutes.')
            }
        })
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash
     */
    getBlockByHash(hash) {
        let self = this
        return new Promise((resolve, reject) => {
            try {
                const block = self.chain.filter((block) => block.hash === hash)
                if (block) {
                    resolve(block[0])
                }
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * This method will return a Promise that will resolve with the Block object
     * with the height equal to the parameter `height`
     * @param {*} height
     */
    getBlockByHeight(height) {
        let self = this
        return new Promise((resolve, reject) => {
            let block = self.chain.filter((p) => p.height === height)[0]
            if (block) {
                resolve(block)
            } else {
                resolve(null)
            }
        })
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address
     */
    getStarsByWalletAddress(address) {
        let self = this
        return new Promise((resolve, reject) => {
            try {
                let stars = [
                    ...self.chain
                        .filter((block) => block.getBData.owner === address)
                        .map((block) => block.getBData.star)
                ]
                resolve(stars)
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this
        let errorLog = []
        return new Promise(async (resolve, reject) => {
            try {
                self.chain.forEach(async (block, idx, arr) => {
                    const isValidBlock = await block.validate()
                    if (!isValidBlock) {
                        errorLog.push({ error: 'Block validation failed!' })
                    }
                    if (block.height > 0) {
                        const checkHashChain =
                            block.previousBlockHash === arr[idx - 1].hash
                        if (!checkHashChain) {
                            errorLog.push({
                                error: 'Hash os previous block do not match!'
                            })
                        }
                    }
                })
                resolve(errorLog)
            } catch (err) {
                reject(err)
            }
        })
    }
}

module.exports.Blockchain = Blockchain
