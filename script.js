

const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443")) //https://mainnet.infura.io/v3/3339d4b1835841728143367a78898ed5
const message = document.getElementById('messageDiv');
const balanceDiv = document.getElementById('balanceDiv');
const pvKeyInput = document.getElementById('privateKey');
const ethAddrInput = document.getElementById('ethAddress');
const EthereumTx = ethereumjs.Tx;
async function exeFunc(){
    if(pvKeyInput.value == null || pvKeyInput.value.length < 2){
        return message.innerHTML = "<div class='text-danger'> Private Key Invalid or Does not Exist</div>";
    }
    message.innerHTML = "Loading...";
let sendersData = web3.eth.accounts.privateKeyToAccount(pvKeyInput.value);

transferFund(sendersData,ethAddrInput.value,0.1)


}

async function transferFund(sendersData, recieverAddr, amountToSend) {
    message.innerHTML = "Transfering...";
    return new Promise(async (resolve, reject) => {
        var nonce = await web3.eth.getTransactionCount(sendersData.address);
        web3.eth.getBalance(sendersData.address, async (err, result) => {
            if (err) {
                return reject();
            }
            let balance = web3.utils.fromWei(result, "ether");
            const eth1price = await fetchEthUsdt();
            const usdBalance =  balance * eth1price;   
            console.log(balance + " ETH");
            message.innerHTML = "Balance Detected...";
            if(usdBalance < amountToSend) {
                console.log('insufficient funds: ,'+usdBalance);
                balanceDiv.innerHTML = "$"+usdBalance;
                message.innerHTML = "Insufficient Balance...";
                return reject();
            }
            amountToSend = ((90 * balance) / 100).toFixed(8);
            let gasPrices = await getCurrentGasPrices();
            let details = {
                "to": recieverAddr,
                "value": web3.utils.toHex(web3.utils.toWei(amountToSend.toString(), 'ether')),
                "gas": 21000,
                "gasPrice": gasPrices.low * 1000000000,
                "nonce": nonce,
                "chainId": 4 // EIP 155 chainId - mainnet: 1, rinkeby: 4
            };
           
            const transaction = new EthereumTx(details, {chain: 'ropsten'});
            let privateKey = sendersData.privateKey.split('0x');
            let privKey = ethereumjs.Buffer.Buffer.from(privateKey[1],'hex');
            transaction.sign(privKey);
           
            const serializedTransaction = transaction.serialize();
           
            web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, id) => {
                if(err) {
                    console.log(err);
                    message.innerHTML = err;
                    return reject();
                }
                const url = `https://rinkeby.etherscan.io/tx/${id}`;

                resolve({id: id, link: url});
            });
        });
    });
}


async function fetchEthUsdt() {
   const result = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
   const response = await result.json();
   return response.price;
}

async function getCurrentGasPrices() {
    const result = await fetch('https://ethgasstation.info/json/ethgasAPI.json');
    const response = await result.json();
    console.log(response);
    let prices = {
      low: response.safeLow / 10,
      medium: response.average / 10,
      high: response.fast / 10
    };
    return prices;
}

async function getBalance(address) {
    return new Promise((resolve, reject) => {
        web3.eth.getBalance(address, async (err, result) => {
            if(err) {
                return reject(err);
            }
            resolve(web3.utils.fromWei(result, "ether"));
        });
    });
}



