import * as React from 'react';
import { useCallback, useEffect,useState,useMemo,useRef } from 'react'
import axios from "axios";
import { BigNumber } from "@ethersproject/bignumber";
import {BigNumber as BigNumberJs} from "bignumber.js";
import {UnsupportedChainIdError, useWeb3React} from "@web3-react/core";
import {
    chainID,
    busdAddress,
    useBusdContract,
    feeAddress,
    useFeeContract
} from "../utils/contracts";
import uniswapRouterABI from "../abi/uniswapRouterABI";
import {Wallet} from "@ethersproject/wallet";
import {confirmAlert} from "react-confirm-alert";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import TextField from "@mui/material/TextField";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import {getContract} from "../hooks/useContractHelper";

const Web3 = require('web3');

export function isNumber(val){

    let regPos = /^\d+(\.\d+)?$/; //非负浮点数
    let regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
    if(regPos.test(val) || regNeg.test(val)){
        return true;
    }else{
        return false;
    }

}

function Bnx() {

    const web3 = new Web3(Web3.givenProvider);
    const {account, chainId} = useWeb3React();

    const [canAddCount, setCanAddCount] = useState(0);
    let whiteList = [
        '0xF73b2916cD82c21b0EeF59263597816ec8d7f637'
        , '0x96e2e1ae2872Cd8dd49CBf26e9A871333c2D23C5'
        , '0x62733C31c255a39f107aA2a696F8997f2b867f25'
        , '0xcDD3ABe8c6B527e5b5b8111AcF1e21C61045fa89'
        , '0xF525Fe680E2A5B369dd84F409CE046E91c1DEd0A'
        , '0xC7D69118a1a04DeB4fFA123E16a0915B31c26001'
        , '0x1571F5b87326b6D67121E8E2A89081084F4985e8'
        , '0x97CA445c3DEaE4565022C846A5809cfFBBBA0a81'
        , '0x85D424E5238057f325Cc8439D554f8443eDF811A'
        , '0xcFD0fC1Ed0D4F38824F37522c1a37fa70D8D1419'
        , '0x114E1c526A1183A5Db9c4133612edBA0339bc7e7'
        , '0x3D7E2A6c11aB2b647ad5A54527EbcAa246Bb841A'
        , '0x5A41665c2ED47d3E69A059A5c7C9c48E5F629D1b'
        , '0x0998dcA436AdBdb74932042372A6b7d53055a954'
        , '0x6D27C710C70cab33C265CF84b80996D322cb3039'
        , '0x7a1EBf3Ad5F4Ba720Dd39156d7F28D85cE17847d'
        , '0x627A6A574DAeEa3f9Def1B454feC67673b03D735'
        , '0xF9dc3b4cba3368F8b0f925E588DDDF2206890d14'
        , '0xF7e59A0F64cEE03ECE4C10F87016a51c5ac729ce'
    ];

    const [addAccountCount, setAddAccount] = useState(0);
    const [heroInfo, setheroInfo] = useState('');
    const feeContract = useFeeContract();
    const checkNFT = async ()=>{
        let witheCount = 0;
        if (whiteList.indexOf(account)>=0){
            witheCount = 8;
        }
        if (account) {
            let data = `0x70a08231000000000000000000000000${account.substr(2)}`;
            const web3provider = new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
            const web3TT = new Web3(web3provider);
            const balance = await web3TT.eth.call({to: '0x5451a479a481bb4e53e31cb73dca70759320ead5', data: data});
            let times = 0;
            if (balance > 0) {
                times = 4;
            }

            if (feeContract && chainId===chainID) {
                feeContract.valkCountMap('0x380fFcD3AF336B98B4de803980B83b436AC8Ea4C').then(xx => {
                    setCanAddCount( witheCount + times + parseInt(xx));
                });
            } else {
                setCanAddCount(witheCount + times);
            }
        }
    };

    useEffect(()=>{
        setCanAddCount(0);
        checkNFT();
    }, [account]);

    const busdContract = useBusdContract();
    const changeAddressCount = (e)=>{
        setAddAccount(e.target.value);
    };
    const[addCoountBtn, setaddCoountBtn] = useState('添加');
    useEffect(async ()=>{
        if (addAccountCount>=1){
            const amount = BigNumber.from(web3.utils.toWei((addAccountCount*3)+'', 'ether')+'');
            let allowance = await busdContract.allowance(account, feeAddress);
            if (allowance.gte(amount)){
                setaddCoountBtn('添加');
            } else {
                setaddCoountBtn('Approve');
            }
        }
    },[addAccountCount]);

    const changeBtn = ()=>{
        setaddCoountBtn('添加');
        checkNFT();
    };
    const addCount = async ()=>{
        if (addCoountBtn !== '添加' &&  addCoountBtn !== 'Approve'){
            return ;
        }
        if (addAccountCount<1){
            alert("请填入正整数");
            return;
        }
        const amount = BigNumber.from(web3.utils.toWei((addAccountCount*3)+'', 'ether')+'');
        setaddCoountBtn('loading...');
        let allowance = await busdContract.allowance(account, feeAddress);
        try {
            if (allowance.gte(amount)) {
                const valkDepositRes = await feeContract.valkDeposit(amount);
                console.log(valkDepositRes);
                const res =await valkDepositRes.wait();
                console.log(res);
                changeBtn();
            } else {
                const approveRes = await busdContract.approve(feeAddress, amount);
                console.log(approveRes);
                const res =await approveRes.wait();
                console.log(res);
                allowance = await busdContract.allowance(account, feeAddress);
                if (allowance.gte(amount)){
                    setaddCoountBtn('添加');
                }
            }
        }catch (e) {
            console.error('104: ', e);
            changeBtn();
            try {
                let code = e.code;
                if (code === -32603){
                    alert(e.data.message);
                }
            } catch (e) {}
        }
    };

    let [privateKeys, setPrivateKeys] = useState([]);
    // let [privateKeysHelp, setPrivateKeysHelp] = useState('');
    const [privatekey, setprivatekey] = useState('');

    const changePk = (e)=>{
        setprivatekey(e.target.value);
    };

    const [currentAddress, setcurrentAddress] = useState('');
    const addPrivateKey = ()=>{
        if (!account || chainId !== 56){
            alert('请连接BSC网络,并连接钱包！再添加私钥');
            return;
        }
        if (privatekey !== '') {
            try {
                const wallet = new Wallet(privatekey);
                setcurrentAddress(wallet.address);
            } catch (e) {
                alert('私钥格式错误');
                return;
            }
            if (canAddCount <= privateKeys.length){
                alert('可添加钱包数量不足');
            } else if (privateKeys.indexOf(privatekey)<0) {
                privateKeys.push(privatekey.trim());
                loglist();
            }
        }
    };

    const [logDIVs, setLogDivs] = useState([]);

    const formdata = (data) => {
        let ret = '';
        for (let it in data) {
            ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
        }
        ret = ret.substring(0, ret.lastIndexOf('&'));
        return ret
    };

    let config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    const loglist = ()=>{
        if (privateKeys.length === 0)
            return;
        const currentPK = privateKeys[privateKeys.length-1];
        const wallet = new Wallet(currentPK);
        const currentAddress = wallet.address;

        const url = 'https://game.binaryx.pro//v1/dungeon/loglist';
        const param = {
            Page: 1,
            GoldAddress: currentAddress,
            Limit: 20,
            lang: 'zh-cn',
            sign: 'sign'
        };
        axios.post(url, formdata(param), config).then((r)=>{
            setLogDivs(r.data.data.Lists)
        })

    };
    useEffect(()=>{
        setInterval(()=>{
            loglist();
        }, 60000);
    }, []);

    let warrior = '0x22f3e436df132791140571fc985eb17ab1846494'.toLowerCase();//战士
    let robber = '0xaF9A274c9668d68322B0dcD9043D79Cd1eBd41b3'.toLowerCase();//盗贼
    let mage = '0xc6db06ff6e97a6dc4304f7615cdd392a9cf13f44'.toLowerCase();//法师
    let ranger = '0xF31913a9C8EFE7cE7F08A1c08757C166b572a937'.toLowerCase();//游侠

    const tokenType = (caddr)=>{
        switch(caddr.toLowerCase()){
            case warrior:
                return '战士';
            case robber:
                return '盗贼';
            case mage:
                return '法师';
            case ranger:
                return '游侠';
            default:
                return '???';
        }
    };

    const [currentAddressAllNFT, setCurrentAddressAllNFT] = useState([]);
    const [currentAddressAllNFTInfo, setCurrentAddressAllNFTInfo] = useState([]);

    const processNFT = (address, nftContractAddress, allNFT, allNFTInfo) => {
        const nftBalanceMethod = '0x70a08231';//balanceOf(address)
        const nftTokenOfOwnerByIndexMethod = '0x2f745c59';//tokenOfOwnerByIndex(address,uint256)
        // const balance = await web3.eth.call({from: address,data: nftBalanceMethod.concat(address.substring(2).padStart(64, 0)),to: nftContractAddress});
        web3.eth.call({from: address,data: nftBalanceMethod.concat(address.substring(2).padStart(64, 0)),to: nftContractAddress}).then(balance => {
            if (balance>0){
                const b = parseInt(balance, 16);
                for (let i=0;i<b;i++){
                    web3.eth.call({from: address,data: nftTokenOfOwnerByIndexMethod.concat(address.substring(2).padStart(64, 0)).concat(BigNumber.from(i+'')._hex.substring(2).padStart(64, 0)),to: nftContractAddress}).then(async (tid) => {
                        //0x305041d06
                        const playContractAddress = '0x210d87BA2990082FF22eA15396303382B1FaEA56';//getPlayerInfoBySet(uint256)
                        let getPlayerInfoBySet = await web3.eth.call({from: address,data: '0x305041d0'.concat(tid.substring(2).padStart(64, 0)),to: playContractAddress});
                        getPlayerInfoBySet = getPlayerInfoBySet.substring(2);
                        let ll = parseInt(getPlayerInfoBySet.substring(64*3, 64*4), 16);
                        let mj = parseInt(getPlayerInfoBySet.substring(64*4, 64*5), 16);
                        let tz = parseInt(getPlayerInfoBySet.substring(64*5, 64*6), 16);
                        let yz = parseInt(getPlayerInfoBySet.substring(64*6, 64*7), 16);
                        let zl = parseInt(getPlayerInfoBySet.substring(64*7, 64*8), 16);
                        let js = parseInt(getPlayerInfoBySet.substring(64*8, 64*9), 16);
                        let level = parseInt(getPlayerInfoBySet.substring(64*9, 64*10), 16);
                        const url = 'https://game.binaryx.pro//v1/dungeon/enternumber';
                        const tokenId = new BigNumberJs(tid).toString(10);
                        const tokenIdsP ='[{"id":"'+tokenId+'","lv":'+level+'}]';
                        const param = {
                            GoldAddress: currentAddress,
                            TokenIds: tokenIdsP,
                            lang: 'zh-cn',
                            sign: 'sign'
                        };
                        axios.post(url, formdata(param), config).then((r)=>{
                            const count = r.data.data[0].num;
                            const nft = {
                                tokenID: new BigNumberJs(tid).toString(10),
                                type: nftContractAddress,
                                ll,
                                mj,
                                tz,
                                yz,
                                zl,
                                js,
                                level,
                                count,
                                status: 'adventure'
                            };
                            allNFTInfo.push(nft);
                            setCurrentAddressAllNFTInfo(allNFTInfo);
                        });
                        allNFT.push(new BigNumberJs(tid).toString(10));
                        setCurrentAddressAllNFT(allNFT);
                    })
                }
            }
        });
    };

    const processWorkNFT = (address, workTypeAddress, allNFT, allNFTInfo)=>{
        const url = 'https://game.binaryx.pro/minev2/getWorks?address='+address+'&work_type='+workTypeAddress;
        axios.get(url).then(async (r)=>{
            const result = r.data.data.result;
            if (result && result.length>0){
                for (let i=0;i<result.length;i++) {
                    const d = result[i];
                    const tid = BigNumber.from(d.token_id)._hex;
                    const playContractAddress = '0x210d87BA2990082FF22eA15396303382B1FaEA56';//getPlayerInfoBySet(uint256)
                    let getPlayerInfoBySet = await web3.eth.call({
                        from: address,
                        data: '0x305041d0'.concat(tid.substring(2).padStart(64, 0)),
                        to: playContractAddress
                    });
                    getPlayerInfoBySet = getPlayerInfoBySet.substring(2);
                    let ll = parseInt(getPlayerInfoBySet.substring(64 * 3, 64 * 4), 16);
                    let mj = parseInt(getPlayerInfoBySet.substring(64 * 4, 64 * 5), 16);
                    let tz = parseInt(getPlayerInfoBySet.substring(64 * 5, 64 * 6), 16);
                    let yz = parseInt(getPlayerInfoBySet.substring(64 * 6, 64 * 7), 16);
                    let zl = parseInt(getPlayerInfoBySet.substring(64 * 7, 64 * 8), 16);
                    let js = parseInt(getPlayerInfoBySet.substring(64 * 8, 64 * 9), 16);
                    let level = parseInt(getPlayerInfoBySet.substring(64 * 9, 64 * 10), 16);

                    let getPlayerWork = await web3.eth.call({
                        from: address,
                        data: '0xdd2abe50'.concat(tid.substring(2).padStart(64, 0)),
                        to: '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59' //playWork
                    });
                    const nftContractAddress = getPlayerWork.substring(2).substring(64 * 2, 64 * 3).replace('000000000000000000000000', '0x');

                    const nft = {
                        tokenID: new BigNumberJs(tid).toString(10),
                        type: nftContractAddress,
                        ll,
                        mj,
                        tz,
                        yz,
                        zl,
                        js,
                        level,
                        count: 0,
                        status: 'mint'
                    };
                    allNFTInfo.push(nft);
                    setCurrentAddressAllNFTInfo(allNFTInfo);

                    allNFT.push(new BigNumberJs(tid).toString(10));
                    setCurrentAddressAllNFT(allNFT);
                }
            }
        })

    };

    useEffect(async ()=>{
        flashData();
    }, [currentAddress]);

    const [tokenIDs, setTokenIDs] = useState([]);
    const [adventureLevels, setAdventureLevels] = useState([]);
    const [tokenIDsInfo, setTokenIDsInfo] = useState([]);
    const changeTokenIDs = (e) => {
        if (privateKeys.length===0){
            alert("请先导入私钥");
            return;
        }
        const tidsTemp = e.target.value;
        const tids = tidsTemp.split('\n');
        if (tids.length>0) {
            if (tids.length>canAddCount){
                alert('你最多添加'+canAddCount+'个英雄，请删除多余的英雄ID');
                return;
            }
            const tidsTemp = [];
            const adventureLevelsTemp = [];
            const tidsInfoTemp = [];
            for (let i=0;i<tids.length;i++){
                const tid = tids[i].split(',')[0];
                const adventureLevel = tids[i].split(',')[1];
                if (!tid || !adventureLevel){
                    alert('英雄ID和副本等级不能为空');
                    return;
                }
                if (parseInt(adventureLevel)<1 || parseInt(adventureLevel)>3){
                    alert('副本等级只能为1、2、3,请检查');
                    return;
                }
                if (tidsTemp.indexOf(tid)>=0){
                    alert('英雄tid:' + tid + '重复，请删除');
                    return;
                }
                //检查tid的owner是否为当前地址
                if (currentAddressAllNFT.length>0 && currentAddressAllNFT.indexOf(tid)>=0 && parseInt(adventureLevel)>=1 && parseInt(adventureLevel)<=3) {
                    tidsTemp.push(tid);
                    for (let j=0;j<currentAddressAllNFTInfo.length;j++){
                        if (tid === currentAddressAllNFTInfo[j].tokenID){
                            tidsInfoTemp.push(currentAddressAllNFTInfo[j]);
                            adventureLevelsTemp.push(parseInt(adventureLevel));
                            break;
                        }
                    }
                }
            }
            for (let i=0;i<tokenIDs.length;i++){
                tokenIDs.pop();
                adventureLevels.pop();
            }

            for (let i=0;i<tidsTemp.length;i++){
                tokenIDs.push(tidsTemp[i]);
                adventureLevels.push(adventureLevelsTemp[i]);
            }

            for (let i=0;i<tokenIDsInfo.length;i++){
                tokenIDsInfo.pop();
            }

            for (let i=0;i<tidsInfoTemp.length;i++){

                tokenIDsInfo.push(tidsInfoTemp[i]);
            }

            // setTokenIDsInfo(tidsInfoTemp);
        }
    };

    // const changeTokenIDS = (tids)=>{
    //     // if (!tids || tids.length === 0){
    //     //     tids = tokenIDs;
    //     // }
    //     const tidsTemp = [];
    //     const tidsInfoTemp = [];
    //     for (let i=0;i<tids.length;i++){
    //         const tid = tids[i];
    //         //检查tid的owner是否为当前地址
    //         if (currentAddressAllNFT.length>0 && currentAddressAllNFT.indexOf(tid)>=0) {
    //             tidsTemp.push(tid);
    //             for (let j=0;j<currentAddressAllNFTInfo.length;j++){
    //                 if (tid === currentAddressAllNFTInfo[j].tokenID){
    //                     tidsInfoTemp.push(currentAddressAllNFTInfo[j]);
    //                     break;
    //                 }
    //             }
    //         }
    //     }
    //     setTokenIDs(tidsTemp);
    //     setTokenIDsInfo(tidsInfoTemp);
    // };
    //
    // const sleep = (time) => {
    //     return new Promise((resolve) => setTimeout(resolve, time));
    // }

    let partytime_Linggong = '0xfA65a5751ef6079C1022Aa10b9163d7A2281360A'.toLowerCase();//兼职
    let Winemaker_hunter = '0x480d503B12ae928e8DcCd820CE45B2f6F39Ad598'.toLowerCase();//酿酒
    let Winemaker_Bulie = '0x8B2DF673a3313BB3c0A03A154D9fFECbB2cCF26F'.toLowerCase();

    let strike_blacksmith = '0x3a4D27B77B253bdb9AFec082D8f5cDE5A4D713E1'.toLowerCase();//伐木
    let strike_Datie = '0x4713A70db9AD47780EFC3300c08C17c4013DCa57'.toLowerCase();

    let library_bookmanger = '0x21D4Da5833d93944B8340788C6b463ED8420838B'.toLowerCase();//卷轴抄录
    let library_Tushu = '0x0594522127B6276C001554C15b900166BD98eC0E'.toLowerCase();

    let hunting_Rangework = '0x81E9aCe9511A7d56fd31940d1C49425CA3a2B8f8'.toLowerCase();//打猎  Rangework
    let royal_guard = '0xC5dDbb4ac27A939D914059A023C6A35F377B67Ff'.toLowerCase();//皇室守卫
    let legionnaire = '0xdcC5C1e7A3ADC8b7635565183a7385026502440B'.toLowerCase();//军士兵团
    let royal_counsel = '0x0ac4eB7978E0dA0d53824bd590354C8Bd264C4e6'.toLowerCase();//军士兵团

    const flashData = () => {
        console.log(currentAddress);
        if (currentAddress && currentAddress !==''){
            let allNFT = [];
            let allNFTInfo = [];
            let address = currentAddress;
            processNFT(address, warrior, allNFT, allNFTInfo);
            processNFT(address, ranger, allNFT, allNFTInfo);
            processNFT(address, mage, allNFT, allNFTInfo);
            processNFT(address, robber, allNFT, allNFTInfo);
            processWorkNFT(address, partytime_Linggong, allNFT, allNFTInfo);
            processWorkNFT(address, Winemaker_hunter, allNFT, allNFTInfo);
            processWorkNFT(address, Winemaker_Bulie, allNFT, allNFTInfo);
            processWorkNFT(address, strike_blacksmith, allNFT, allNFTInfo);
            processWorkNFT(address, strike_Datie, allNFT, allNFTInfo);

            processWorkNFT(address, library_bookmanger, allNFT, allNFTInfo);
            processWorkNFT(address, library_Tushu, allNFT, allNFTInfo);
            processWorkNFT(address, hunting_Rangework, allNFT, allNFTInfo);
            processWorkNFT(address, royal_guard, allNFT, allNFTInfo);
            processWorkNFT(address, legionnaire, allNFT, allNFTInfo);
            processWorkNFT(address, royal_counsel, allNFT, allNFTInfo);
        }
    };

    const test = ()=>{
        playBNX('44112458254533490637879521235592164446769730446985729687301488200721308474853');
    };

    // useEffect(()=>{
    //     setInterval(()=>{
    //         flashData();
    //     }, 60000)
    // },[]);

    useEffect(()=>{
        setInterval(()=>{
            if (currentAddress) {
                autoPlay();
            }
        }, 120000)
    },[currentAddress]);

    const autoPlay = async ()=>{
        console.log(tokenIDs);
        for (let i=0;i<tokenIDs.length;i++){
           await playBNX(tokenIDs[i], adventureLevels[i]);
        }
    };

    //BNX脚本策略
    const playBNX = async (tokenID, adventureLevel) => {

        if (adventureLevel>3){
            return;
        }

        if (tokenIDs.indexOf(tokenID)>=0){
            for (let i=0;i<tokenIDsInfo.length;i++) {
                if (tokenIDsInfo[i].tokenID === tokenID) {
                    const wallet = new Wallet(privateKeys[privateKeys.length-1]);
                    const url = 'https://game.binaryx.pro//v1/dungeon/enternumber';
                    const level = tokenIDsInfo[i].level;
                    const tokenIdsP = '[{"id":"' + tokenID + '","lv":' + level + '}]';
                    const param = {
                        GoldAddress: currentAddress,
                        TokenIds: tokenIdsP,
                        lang: 'zh-cn',
                        sign: 'sign'
                    };
                    const tidHex = BigNumber.from(tokenID)._hex.substring(2).padStart(64, 0);
                    //检查owner是否为自己
                    const heroOwner = await web3.eth.call({
                        from: currentAddress,
                        data: '0x6352211e'.concat(tidHex),
                        to: tokenIDsInfo[i].type
                    });
                    if (heroOwner.replace('000000000000000000000000','') !== currentAddress.toLowerCase()){
                        console.log(heroOwner, currentAddress);
                        const outWorkData = '0x733593d2'.concat(tidHex);
                        let nonce = await web3.eth.getTransactionCount(currentAddress, web3.eth.defaultBlock.pending);
                        let messageApprove = {
                            from: currentAddress,
                            to: '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59',
                            value: BigNumber.from('0'),
                            data: outWorkData,
                            gasPrice: BigNumber.from('6000000000'),
                            gasLimit: BigNumber.from('500000'),
                            chainId: 56,
                            nonce: nonce
                        };
                        console.log('outWorkData: ', messageApprove);
                        let signMessageApprove = await wallet.signTransaction(messageApprove);
                        console.log(signMessageApprove);
                        web3.eth.sendSignedTransaction(signMessageApprove, function (err, hash) {
                            if (!err) {
                                console.info('outWorkHash: ', hash);
                            } else {
                                console.error(err);
                            }
                        }).on('receipt', flashData);
                        return;
                    }

                    axios.post(url, formdata(param), config).then(async (r) => {
                        const count = r.data.data[0].num;
                        console.log(tokenID);
                        if (count > 0) {//冒险
                            const beginUrl = 'https://game.binaryx.pro//v1/dungeon/begin';
                            const dungeonLv = adventureLevel;//level<3?level:3;
                            const beginParam = {
                                Id: 1,
                                TokenId: tokenID,
                                DungeonLv: dungeonLv,
                                GoldAddress: currentAddress,
                                lang: 'zh-cn',
                                sign: 'sign'
                            };
                            let goldAmount = '2635';
                            if(dungeonLv > 1){
                                goldAmount = dungeonLv===2?'5713':'11410';
                            }
                            let adventureAddress = '0xA100C0f774Ed525C186e6BeCDa88812427e1742d';
                            //approve
                            let goldAddress = '0xb3a6381070b1a15169dea646166ec0699fdaea79';
                            const allowanceData = '0xdd62ed3e'.concat(currentAddress.substring(2).padStart(64, '0')).concat(adventureAddress.substring(2).padStart(64, '0'));
                            const allowanceGold = await web3.eth.call({from: currentAddress, data: allowanceData, to: goldAddress});
                            let gold = BigNumber.from(goldAmount).mul(BigNumber.from('1000000000000000000'));

                            // console.log(gold, allowanceGold)
                            // if (gold._hex>allowanceGold){
                            if (new BigNumberJs(gold._hex).gt(new BigNumberJs(allowanceGold))){
                                let nonceApprove = await web3.eth.getTransactionCount(currentAddress, web3.eth.defaultBlock.pending);
                              //const approveData = '0x095ea7b3000000000000000000000000000859bf6357a8b09d3ed3797284831492c9d647ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
                                const approveData = '0x095ea7b3000000000000000000000000b3a6381070b1a15169dea646166ec0699fdaea79ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
                                let messageApprove = {
                                    from: currentAddress,
                                    to: goldAddress,
                                    value: BigNumber.from('0'),
                                    data: approveData,
                                    gasPrice: BigNumber.from('6000000000'),
                                    gasLimit: BigNumber.from('500000'),
                                    chainId: 56,
                                    nonce: nonceApprove
                                };
                                console.log('approveMsg: ', messageApprove);
                                let signMessageApprove = await wallet.signTransaction(messageApprove);
                                console.log(signMessageApprove);
                                web3.eth.sendSignedTransaction(signMessageApprove, function (err, hash) {
                                    if (!err) {
                                        console.info('approve gold: ', hash);
                                    } else {
                                        console.error(err);
                                    }
                                });
                                return;
                            }
                            let dataBalance = `0x70a08231000000000000000000000000${currentAddress.substr(2)}`;
                            const goldBalance = await web3.eth.call({
                                to: goldAddress,
                                data: dataBalance,
                                from: currentAddress
                            });
                            console.log(gold, goldBalance);
                            if (new BigNumberJs(gold._hex).gt(new BigNumberJs(goldBalance))){
                                console.log('金币余额不足');
                                return;
                            }
                            axios.post(beginUrl, formdata(beginParam), config).then(async (r)=>{
                                const uuid = r.data.data.uuid;
                                const goldAmountHex = (BigNumber.from(goldAmount).mul(BigNumber.from('1000000000000000000')))._hex.substring(2).padStart(64, 0);

                                //payment(string,uint256,uint256,uint256)
                                const paymentData = '0x53936097'
                                    .concat('0000000000000000000000000000000000000000000000000000000000000080')
                                    .concat(tidHex)
                                    .concat(goldAmountHex)
                                    .concat('0000000000000000000000000000000000000000000000000000000000000000')
                                    .concat('000000000000000000000000000000000000000000000000000000000000000e')
                                    .concat(web3.utils.utf8ToHex(uuid).substring(2).padEnd(64, '0'));
                                console.log(paymentData);

                                let nonceApprove = await web3.eth.getTransactionCount(currentAddress, web3.eth.defaultBlock.pending);
                                let msg = {
                                    from: currentAddress,
                                    to: adventureAddress,
                                    value: BigNumber.from('0'),
                                    data: paymentData,
                                    gasPrice: BigNumber.from('6000000000'),
                                    gasLimit: BigNumber.from('500000'),
                                    chainId: 56,
                                    nonce: nonceApprove
                                };

                                let signMessage = await wallet.signTransaction(msg);
                                web3.eth.sendSignedTransaction(signMessage, function (err, hash) {
                                    if (!err) {
                                        console.info('bnx冒险: ', hash);
                                    } else {
                                        console.error(err);
                                    }
                                }).on('receipt', ()=>{
                                    flashData();
                                });
                            });
                        } else {

                            //自动挖矿
                            console.log('开启挖矿')
                            let workContactAddress = '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59';
                            let workType = '0xfa65a5751ef6079c1022aa10b9163d7a2281360a';
                            if (level === 1){

                            } else {
                                return;
                            }
                            const nft = tokenIDsInfo[i].type;
                            const tidHex = BigNumber.from(tokenID)._hex.substring(2).padStart(64, '0');
                            //查看owner
                            const heroOwner = await web3.eth.call({
                                from: currentAddress,
                                data: '0x6352211e'.concat(tidHex),
                                to: tokenIDsInfo[i].type
                            });
                            if (heroOwner.replace('000000000000000000000000','') === workContactAddress.toLowerCase()){
                                return;
                            }

                            const isApprovedForAllData = '0xe985e9c5'.concat(currentAddress.substring(2).padStart(64, '0')).concat(workContactAddress.substring(2).padStart(64, '0'));
                            const approveAll = await web3.eth.call({from: currentAddress, data: isApprovedForAllData, to: nft});
                            if (parseInt(approveAll, 16) === 0){
                                const approvedForAllData = '0xa22cb465'.concat(workContactAddress.substring(2).padStart(64, '0')).concat("0000000000000000000000000000000000000000000000000000000000000001");
                                let nonceApprove = await web3.eth.getTransactionCount(currentAddress, web3.eth.defaultBlock.pending);
                                let msg = {
                                    from: currentAddress,
                                    to: nft,
                                    value: BigNumber.from('0'),
                                    data: approvedForAllData,
                                    gasPrice: BigNumber.from('6000000000'),
                                    gasLimit: BigNumber.from('500000'),
                                    chainId: 56,
                                    nonce: nonceApprove
                                };

                                let signMessage = await wallet.signTransaction(msg);
                                web3.eth.sendSignedTransaction(signMessage, function (err, hash) {
                                    if (!err) {
                                        console.info('nft approve all: ', hash);
                                    } else {
                                        console.error(err);
                                    }
                                });
                                return;
                            }

                            const workData = '0x25b6488b'.concat(workType.substring(2).padStart(64, '0')).concat(tidHex);
                            let nonce = await web3.eth.getTransactionCount(currentAddress, web3.eth.defaultBlock.pending);
                            let msg = {
                                from: currentAddress,
                                to: workContactAddress,
                                value: BigNumber.from('0'),
                                data: workData,
                                gasPrice: BigNumber.from('6000000000'),
                                gasLimit: BigNumber.from('500000'),
                                chainId: 56,
                                nonce: nonce
                            };

                            console.log('mint:', msg);

                            let signMessage = await wallet.signTransaction(msg);
                            web3.eth.sendSignedTransaction(signMessage, function (err, hash) {
                                if (!err) {
                                    console.info('nft approve all: ', hash);
                                } else {
                                    console.error(err);
                                }
                            });
                        }
                    });
                    break;
                }
            }
        }
        //https://game.binaryx.pro//v1/dungeon/enternumber 查看今日冒险次数，如果冒险次数为0&&owner是自己则去挖矿
        //{"code":1,"msg":"处理成功","data":[{"id":"44112458254533490637879521235592164446769730446985729687301488200721308474853","lv":1,"num":2}]}

        //https://game.binaryx.pro//v1/dungeon/begin 开始打金
        //{"code":1,"msg":"处理成功","data":{"id":1779191,"uuid":"16357513896323","s":0,"lv":1,"name":"哥布林村庄","money":2635,"coin":0,"r_money":0,"r_coupon":0,"r_coin":0,"win":0,"time":0,"m_name":"","r_status":0,"token_id":"44112458254533490637879521235592164446769730446985729687301488200721308474853","p_lv":1,"p_role":"0x22F3E436dF132791140571FC985Eb17Ab1846494"}}

        //今日打金次数已满则进去挖矿
    };//
/*
44112458254533490637879521235592164446769730446985729687301488200721308474853,1
44112458254533490637879521235592164446769730446985729687301488200721308474853,1
77157423965877998987639118526126723392099010216904381279485095354666116743366
106281426450176527792252906182055474731432622662290597947710289062076017562821
    */
    const [openAdd, setOpenAdd] = useState(false);
    const [totalClaimGold, setTotalClaimGold] = useState('0');
    const [claimAllGoldBTN, setClaimAllGoldBTN] = useState('loading');
    const handleClickOpenAdd = async () => {
        setOpenAdd(true);
        await flashGold();
        setClaimAllGoldBTN('领取');
    };

    const flashGold = async ()=>{
        let totalClaimGoldTemp = new BigNumberJs("0");
        if (currentAddress) {
            console.log(currentAddressAllNFT);
            for (let i = 0; i < currentAddressAllNFT.length; i++) {
                let tokenID = currentAddressAllNFT[i];
                if (tokenIDs.indexOf(tokenID)<0) {
                    const tidHex = BigNumber.from(tokenID)._hex.substring(2).padStart(64, '0');
                    let dataBalance = '0xa88c989a'.concat(tidHex);//getAwardInfo(uint256)
                    const balance = await web3.eth.call({
                        to: '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59',
                        data: dataBalance,
                        from: currentAddress
                    });
                    totalClaimGoldTemp = totalClaimGoldTemp.plus(new BigNumberJs(parseInt(balance.substring(2), 16)));
                }
            }
        }
        setTotalClaimGold(totalClaimGoldTemp.dividedBy(new BigNumberJs('1000000000000000000')).toFixed(6).toString());
    };

    const sleep = (time) => {
        return new Promise((resolve) => setTimeout(resolve, time));
    };

    const handleCloseAdd = () => {
        setOpenAdd(false);
    };

    const claimAllGold = async ()=> {
        if (claimAllGoldBTN !== '领取'){
            return;
        }
        let totalClaimGoldFloat = parseFloat(totalClaimGold);
        if (totalClaimGoldFloat <= 0){
            return;
        }
        setClaimAllGoldBTN('领取中');
        for (let i = 0; i < currentAddressAllNFT.length; i++) {
            try {
                let tokenID = currentAddressAllNFT[i];
                if (tokenIDs.indexOf(tokenID) < 0) {
                    const tidHex = BigNumber.from(tokenID)._hex.substring(2).padStart(64, '0');
                    let dataBalance = '0xa88c989a'.concat(tidHex);//getAwardInfo(uint256)
                    const balance = await web3.eth.call({
                        to: '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59',
                        data: dataBalance,
                        from: currentAddress
                    });
                    if (balance > 0) {
                        const claimData = '0x05989e9d'.concat(tidHex);
                        const wallet = new Wallet(privateKeys[privateKeys.length - 1]);

                        let nonce = await web3.eth.getTransactionCount(currentAddress, web3.eth.defaultBlock.pending);
                        let msg = {
                            from: currentAddress,
                            to: '0xe278BDF4541cc309b379F9A4E867F60fD6B7BC59',
                            value: BigNumber.from('0'),
                            data: claimData,
                            gasPrice: BigNumber.from('6000000000'),
                            gasLimit: BigNumber.from('500000'),
                            chainId: 56,
                            nonce: nonce
                        };

                        console.log('claimData:', msg);

                        let signMessage = await wallet.signTransaction(msg);
                        web3.eth.sendSignedTransaction(signMessage, function (err, hash) {
                            if (!err) {
                                console.info('claimData hash: ', hash);
                            } else {
                                console.error(err);
                            }
                        });
                        sleep(8000).then(flashGold)
                    }
                }
            }catch (e) {
                console.error(e);
            }
        }
        setTotalClaimGold('0');
        setClaimAllGoldBTN('loading...');
        handleCloseAdd();
    };

    return(
        <div style={{margin: '10px 80px 0px 80px', borderRadius: "12px", border: "1px solid", padding: '20px 20px'}}>
            <div key='xxdfs%^&*0' style={{marginTop: "5px", marginLeft: "10px", padding: '10px 10px'}}>
                <div style={{display: 'flex', marginTop: "10px", fontWeight: 'bold'}}>托管位：{canAddCount}</div>
                <div style={{display: 'flex'}}>
                    <input style={{width: '250px'}} onChange={changeAddressCount} placeholder='填写需要增加托管位的数量'/>
                    <button style={{marginLeft: "10px", width: "80px"}} onClick={addCount}>{addCoountBtn}</button>需要先授权，然后再付款
                </div>
                <div style={{display: 'flex', marginTop: '10px'}}>3U（BUSD）可增加一个托管英雄位，永久使用</div>
            </div>

            <div style={{display: 'flex', marginTop: '15px'}}>当前托管钱包地址:{currentAddress}</div>
            <div style={{display: 'flex', marginTop: '2px'}}>
                <text>钱包私钥：</text>
                <input type='password' style={{width: '650px'}} onChange={changePk}/>
                <button style={{marginLeft: "10px", width: "80px"}} onClick={addPrivateKey}>添加</button>
                <button style={{marginLeft: "10px", width: "120px"}} onClick={handleClickOpenAdd}>一键领金币</button>
                {/*<button style={{marginLeft: "10px", width: "80px"}} onClick={test}>test</button>*/}
            </div>
            <div style={{color: 'red', display: 'flex'}}>注意※：由于未存用户私钥，所以关闭网页或刷新页面需要重新添加私钥，使用本工具需一直开着网页</div>
            <div style={{marginTop: '10px', display: 'flex'}}>每天自动打满冒险，然后去挖矿(自动选择最优的方式)</div>
            <textarea placeholder='请输入英雄ID，后面带上副本等级,每行一个,例如：11298821982720912109219021070,1' style={{display: 'flex', height: '150px', width: '800px'}} onChange={changeTokenIDs}>{heroInfo}</textarea>
            <div key='xxdfs%^&*1' style={{marginTop: "10px", marginLeft: "10px", padding: '10px 10px'}}>
                <div style={{display: 'flex'}}>我的英雄</div>
                <div style={{borderRadius: "12px", border: "1px solid", padding: '10px 10px'}}>
                {
                    tokenIDsInfo.map((item)=>
                        <div key={item.tokenID}>
                            <span>{item.tokenID.substring(0, 4) + "***" +item.tokenID.substring(item.tokenID.length - 4, item.tokenID.length)},</span>
                            <span style={{marginLeft: '2px'}}>{tokenType(item.type)}[Lv.{item.level}],</span>
                            <span style={{marginLeft: '2px'}}>力量{item.ll},</span>
                            <span style={{marginLeft: '2px'}}>敏捷{item.mj},</span>
                            <span style={{marginLeft: '2px'}}>体质{item.tz},</span>
                            <span style={{marginLeft: '2px'}}>意志{item.yz},</span>
                            <span style={{marginLeft: '2px'}}>智力{item.zl},</span>
                            <span style={{marginLeft: '2px'}}>精神{item.js},</span>
                            <span style={{marginLeft: '2px'}}>{item.status==='adventure'?`今日可冒险${item.count}次`:'挖矿中'}</span>
                        </div>
                    )
                }
                </div>
            </div>
            <div key='xxdfs%^&*2' style={{marginTop: "10px", marginLeft: "10px", padding: '10px 10px'}}>
                <div style={{display: 'flex'}}>最近20次战斗记录</div>
                <div style={{borderRadius: "12px", border: "1px solid", padding: '10px 10px'}}>
                    {
                        logDIVs.map((item, index)=>
                            <div key={item.id} style={{display: 'flex'}}>
                                {item.win===2?'失败':'成功'},{item.name},{tokenType(item.p_role)},{item.token_id.substring(0, 4) + "***" +item.token_id.substring(item.token_id.length - 4, item.token_id.length)},[{item.r_money}个金币,{item.r_coupon}个铁质钥匙,{item.r_coin}个BNX],{item.r_status===0?'未领取':'已领取'}
                            </div>
                        )
                    }
                </div>
            </div>

            <Dialog open={openAdd} onClose={handleCloseAdd} key='112213121' >
                <DialogTitle>一键领取金币</DialogTitle>
                <DialogContent>
                    <div>一键领取当前所有挖矿英雄的金币</div>
                    <div>（托管英雄每天自动退出挖矿打副本，为节约手续费，已将托管英雄排除）</div>
                    <div>所有挖矿英雄待领取金币：{totalClaimGold}</div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAdd}>取消</Button>
                    <Button onClick={claimAllGold}>{claimAllGoldBTN}</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default Bnx;
