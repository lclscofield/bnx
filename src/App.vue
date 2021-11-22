<template>
    <div id="app">
        <div class="title">BNX 脚本</div>
        <!-- <div class="account">当前地址: {{ account }}</div> -->
        <div class="key-address">当前托管钱包地址: {{ keyAddress }}</div>
        <div class="gas">当前 gasPrice: {{ gasPrice / 1000000000 }} Gwei</div>
        <div class="private-key">
            <label for="key">私钥: </label>
            <input type="password" v-model="privateKey" />
            <span @click="addPrivateKey">添加</span>
        </div>
        <div class="active" v-if="isActive">初始化中......</div>
        <div class="active" v-if="isClaim">领取金币中......</div>
        <div class="hero">
            总英雄: <span>{{ this.nftTokens.length }}</span>
        </div>
        <div class="hero">
            打金小于两天的英雄: <span>{{ this.limitHero }}</span>
        </div>
        <div class="gold">
            可领取金币: <span>{{ totalClaimGold }}</span>
        </div>
        <div class="average">
            平均可领取金币: <span>{{ (totalClaimGold / this.nftTokens.length).toFixed(2) }}</span>
        </div>
        <div class="claim">
            <span @click="claimGold">一键领取金币</span>
        </div>
    </div>
</template>

<script>
import Web3 from 'web3'
import { BigNumber } from '@ethersproject/bignumber'
import { BigNumber as BigNumberJs } from 'bignumber.js'

const web3 = new Web3(Web3.givenProvider)
const ethereum = window.ethereum
const BN = web3.utils.BN

export default {
    name: 'App',

    data() {
        return {
            account: null, // 账户地址
            gasPrice: null, // 当前 gasPrice
            keyAddress: null, // 当前托管钱包地址
            privateKey: null, // 托管的私钥
            nftContractAddressList: [
                ['0x22f3e436df132791140571fc985eb17ab1846494'.toLowerCase(), '战士'], // 战士
                ['0xc6db06ff6e97a6dc4304f7615cdd392a9cf13f44'.toLowerCase(), '法师'], // 法师
                ['0xF31913a9C8EFE7cE7F08A1c08757C166b572a937'.toLowerCase(), '游侠'], // 游侠
                ['0xaF9A274c9668d68322B0dcD9043D79Cd1eBd41b3'.toLowerCase(), '盗贼'], // 盗贼
            ], // NFT 职业合约地址列表
            heroList: [], // 地址中各职业英雄信息
            nftTokens: [], // 所有工作中英雄的 token
            nftTokenBalance: [], // token 对应金币余额
            totalClaimGold: 0, // 可领取的金币
            isActive: false, // 初始化中
            isClaim: false, // 领取金币中
            limitHero: 0, // 打金小于两天的英雄数量
        }
    },

    async created() {
        // 判断 MetaMask 是否存在，使用 MetaMask 的 web3 提供者
        if (typeof ethereum !== 'undefined') {
            // this.linkWallet()
            const chainId = web3.utils.hexToNumberString(await ethereum.request({ method: 'eth_chainId' }))
            console.log('chainId: ', chainId)

            // 循环获取 gasPrice
            this.getGasPrice()
            setInterval(() => {
                this.getGasPrice()
            }, 5000)

            // 监听账户切换
            // ethereum.on('accountsChanged', (accounts) => {
            //     // 账户切换后重新保存账户地址
            //     this.account = accounts[0]
            // })
        }
    },

    methods: {
        // 连接钱包
        async linkWallet() {
            try {
                // 请求用户授权
                const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
                this.account = accounts[0]
                console.log('账户地址', this.account)
            } catch (err) {
                console.log('取消连接', err)
            }
        },
        // 获取 gasPrice
        async getGasPrice() {
            this.gasPrice = new BN(await web3.eth.getGasPrice()).toString()
        },
        // 添加私钥
        async addPrivateKey() {
            const wallet = web3.eth.accounts.privateKeyToAccount(this.privateKey)
            this.keyAddress = wallet.address.toLowerCase()
            // this.getNFTInfo(this.keyAddress)
            this.isActive = true
            this.getWorks(this.keyAddress)
        },
        // 获取账户 nft 信息
        async getNFTInfo(address) {
            const nftBalanceMethod = '0x70a08231' // balanceOf(address)
            const nftTokenOfOwnerByIndexMethod = '0x2f745c59' // tokenOfOwnerByIndex(address,uint256)
            this.nftContractAddressList.forEach(async (item) => {
                let balance = await web3.eth.call({
                    from: address,
                    data: nftBalanceMethod.concat(address.substring(2).padStart(64, 0)),
                    to: item[0],
                })
                balance = parseInt(balance, 16)
                this.heroList.push({
                    nftContractAddress: item[0],
                    name: item[1],
                    num: balance,
                    list: [],
                })
                // 获取英雄信息
                for (let i = 0; i < balance; i++) {
                    const tokenId = await web3.eth.call({
                        from: address,
                        data: nftTokenOfOwnerByIndexMethod.concat(address.substring(2).padStart(64, 0)).concat(
                            web3.utils
                                .toHex(new BN(i + ''))
                                .substring(2)
                                .padStart(64, 0)
                        ),
                        to: item[0],
                    })
                    console.log('tokenId: ', tokenId, new BN(tokenId).toString(10))
                }
            })
            console.log(this.heroList)
        },
        // 获取工作中的英雄个数
        async getWorks(address) {
            const res = await this.$http.get('https://www.binaryx.pro/info/getWorks2', {
                params: {
                    address,
                    work_type: '0xfA65a5751ef6079C1022Aa10b9163d7A2281360A',
                    page: 1,
                    page_size: 1000,
                    direction: 'asc',
                },
            })
            if (res.status === 200 && res.data && res.data.data) {
                const works = res.data.data.result
                console.log('works: ', works)
                this.nftTokens = works.items.map((item) => {
                    return item.token_id
                })
                this.flashGold()
            }
        },
        // 获取所有英雄产出的金币
        async flashGold() {
            this.limitHero = 0
            let totalClaimGoldTemp = new BigNumberJs('0')
            for (let i = 0; i < this.nftTokens.length; i++) {
                let tokenId = this.nftTokens[i]
                const tidHex = BigNumber.from(tokenId)._hex.substring(2).padStart(64, '0')
                let dataBalance = '0xa88c989a'.concat(tidHex) // getAwardInfo(uint256)
                const balance = await web3.eth.call({
                    to: '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59',
                    data: dataBalance,
                    from: this.keyAddress,
                })
                this.nftTokenBalance[i] = new BigNumberJs(parseInt(balance.substring(2), 16))
                    .dividedBy(new BigNumberJs('1000000000000000000'))
                    .toFixed(2)
                if (this.nftTokenBalance[i] < 288 * 2) {
                    this.limitHero++
                }
                totalClaimGoldTemp = totalClaimGoldTemp.plus(new BigNumberJs(parseInt(balance.substring(2), 16)))
                this.totalClaimGold = totalClaimGoldTemp.dividedBy(new BigNumberJs('1000000000000000000')).toFixed(2)
            }
            this.isActive = false
            console.log('总可领取金币: ', this.totalClaimGold)
        },
        // 一键领取金币
        async claimGold() {
            this.isClaim = true
            const wallet = web3.eth.accounts.privateKeyToAccount(this.privateKey)
            const nonce = await web3.eth.getTransactionCount(this.keyAddress, web3.eth.defaultBlock.pending)
            let idx = -1
            for (let i = 0; i < this.nftTokens.length; i++) {
                if (this.nftTokenBalance[i] > 288 * 2) {
                    idx++
                    const tokenId = this.nftTokens[i]
                    const tidHex = BigNumber.from(tokenId)._hex.substring(2).padStart(64, '0')
                    const claimData = '0x05989e9d'.concat(tidHex)

                    const tx = {
                        from: this.keyAddress,
                        to: '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59',
                        data: claimData,
                        gas: BigNumber.from('500000'),
                        chainId: 56,
                        nonce: nonce + idx,
                    }
                    // console.log('claimData: ', tx)

                    const signMessage = await wallet.signTransaction(tx)
                    // console.log('signMessage: ', signMessage)
                    web3.eth.sendSignedTransaction(signMessage.rawTransaction, function (err, hash) {
                        if (!err) {
                            console.info('领取 hash: ', hash)
                        } else {
                            console.error(err)
                        }
                    })
                }
            }
            await this.sleep(10000)
            this.isClaim = false
            this.flashGold()
        },
        // 延迟函数
        sleep(time) {
            return new Promise((resolve) => setTimeout(resolve, time))
        },
    },
}
</script>

<style lang="less">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;

    .title {
        font-size: 30px;
        text-align: center;
        padding: 40px 0 20px 0;
    }

    .account,
    .gas,
    .key-address,
    .private-key,
    .active,
    .gold,
    .hero,
    .average {
        text-align: center;
        padding: 10px 0;
    }

    .private-key {
        input {
            border-radius: 4px;
            line-height: 24px;
            margin: 0 10px;
            width: 400px;
        }

        span {
            display: inline-block;
            background: #42b983;
            color: #eeeeee;
            padding: 0 10px;
            line-height: 30px;
            border-radius: 4px;
            cursor: pointer;
            &:hover {
                background: #1c9b62;
            }
        }
    }

    .active {
        color: #ff0000;
    }

    .gold,
    .hero,
    .average {
        span {
            color: #42b983;
        }
    }

    .claim {
        text-align: center;
        padding: 10px 0;

        span {
            display: inline-block;
            background: #42b983;
            color: #eeeeee;
            padding: 0 20px;
            line-height: 40px;
            border-radius: 4px;
            cursor: pointer;
            &:hover {
                background: #1c9b62;
            }
        }
    }
}
</style>
