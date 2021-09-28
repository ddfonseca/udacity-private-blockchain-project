/**
 *                          Block class
 *  The Block class is a main component into any Blockchain platform,
 *  it will store the data and act as a dataset for your application.
 *  The class will expose a method to validate the data... The body of
 *  the block will contain an Object that contain the data to be stored,
 *  the data should be stored encoded.
 *  All the exposed methods should return a Promise to allow all the methods
 *  run asynchronous.
 */

const SHA256 = require('crypto-js/sha256')
const hex2ascii = require('hex2ascii')

class Block {
    // Constructor - argument data will be the object containing the transaction data
    constructor(data) {
        this.hash = null // Hash of the block
        this.height = 0 // Block Height (consecutive number of each block)
        this.body = Buffer.from(JSON.stringify(data)).toString('hex') // Will contain the transactions stored in the block, by default it will encode the data
        this.time = 0 // Timestamp for the Block creation
        this.previousBlockHash = null // Reference to the previous Block Hash
    }

    validate() {
        let self = this
        return new Promise((resolve, reject) => {
            try {
                const isvalidBlock =
                    self.hash ===
                    SHA256(
                        JSON.stringify({
                            ...self,
                            hash: null
                        })
                    ).toString()
                resolve(isvalidBlock)
            } catch (err) {
                reject(err)
            }
        })
    }
    get getBData() {
        // Getting the encoded data saved in the Block
        let self = this
        return new Promise((resolve, reject) => {
            if (self.height === 0) {
                resolve('Genesis Block!')
            }
            const data = JSON.parse(hex2ascii(self.body))
            if (data) {
                resolve(data)
            } else {
                reject(Error('The block has no data.'))
            }
        })
    }
}

module.exports.Block = Block // Exposing the Block class as a module
