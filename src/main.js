import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import marketplaceAbi from "../contract/chatgroups.abi.json"
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const ChatgroupContractAddress = "0x397812d47A25F81Fee18F55B618e761Fe7567a20"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit
let contract
let chats = []
let messages = []
let chatId

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(marketplaceAbi, ChatgroupContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(ChatgroupContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

const getChats = async function() {
  const _chatsLength = await contract.methods.getChatsLength().call()
  const _chats = []
  for (let i = 0; i < _chatsLength; i++) {
    let _chat = new Promise(async (resolve, reject) => {
      let c = await contract.methods.getChat(i).call()
      resolve({
        index: i,
        owner: c[0],
        title: c[1],
        description: c[2],
        price: new BigNumber(c[3]),
        participans: c[4],
        messages: c[5],
      })
    })
    _chats.push(_chat)
  }
  chats = await Promise.all(_chats)
  renderChats()
}

function renderChats() {
  document.getElementById("chatsList").innerHTML = ""
  chats.forEach((_chat) => {
    const chatElement = _chat.participans.includes(kit.defaultAccount) ? viewChatTemplate(_chat) : joinChatTemplate(_chat)
    document.getElementById("chatsList").innerHTML += chatElement
  })
}

function joinChatTemplate(_chat) {
  return `
  <a class="list-group-item list-group-item-action rounded-0 joinChat" style="cursor: pointer;" id="${_chat.index}">
      <div class="media-body ml-4 joinChat" id="${_chat.index}">
        <div class="d-flex align-items-center justify-content-between mb-1 joinChat" id="${_chat.index}">
          <h6 class="mb-0 joinChat" id="${_chat.index}">${_chat.title} - ${_chat.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD</h6>
        </div>
        <p class="font-italic mb-0 text-small joinChat" id="${_chat.index}">${_chat.description}</p>
      </div>
  </a>
  `
}

function viewChatTemplate(_chat) {
  return `
  <a class="list-group-item list-group-item-action rounded-0 viewChat" style="cursor: pointer;" id="${_chat.index}">
      <div class="media-body ml-4 viewChat" id="${_chat.index}">
        <div class="d-flex align-items-center justify-content-between mb-1 viewChat" id="${_chat.index}">
          <h6 class="mb-0 viewChat" id="${_chat.index}">${_chat.title} - Joined</h6>
        </div>
        <p class="font-italic mb-0 text-small viewChat" id="${_chat.index}">${_chat.description}</p>
      </div>
  </a>
  `
}

async function getMessages() {
  const messagesIndexes = await contract.methods.getMessages(chatId).call()
  let _messages = []

  for (let i of messagesIndexes) {
    let _message = new Promise(async (resolve, reject) => {
      let m = await contract.methods.getMessage(i).call()
      resolve({
        index: i,
        creator: m[0],
        content: m[1],
      })
    })
    _messages.push(_message)
  }

  messages = await Promise.all(_messages)
  
  renderMessages()
}

function renderMessages(){
  document.getElementById("chatBox").innerHTML = ""
  messages.forEach((_message) => {
    const messageElement = _message.creator == kit.defaultAccount ? seMessageTemplate(_message) : reMessageTemplate(_message)
    document.getElementById("chatBox").innerHTML += messageElement
  })
}

function reMessageTemplate(_message){
  return `
  <div class="media w-50 mb-3">${identiconTemplate(_message.creator)}
    <div class="media-body ml-3">
      <div class="bg-light rounded py-2 px-3 mb-2">
        <p class="text-small mb-0 text-muted">${_message.content}</p>
      </div>
      <p class="small text-muted">${_message.creator}</p>
    </div>
  </div>
  `
}

function seMessageTemplate(_message){
  return `
  <div class="media w-50 ml-auto mb-3">
    <div class="media-body">
      <div class="bg-primary rounded py-2 px-3 mb-2">
        <p class="text-small mb-0 text-white">${_message.content}</p>
      </div>
      <p style="font-size: 10px" class="small text-muted">${_message.creator}</p>
    </div>
  </div>
  `
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div>
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}" style="border-radius:24px;">
    </a>
  </div>
  `
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getChats()
  notificationOff()
});

document
  .querySelector("#newChatBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("nameInput").value,
      document.getElementById("descriptionInput").value,
      new BigNumber(document.getElementById("priceInput").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      const result = await contract.methods
        .createChat(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getChats()
  })

document.querySelector("#chatsList").addEventListener("click", async (e) => {
  if (e.target.className.includes("joinChat")) {
    const index = e.target.id
    chatId = index
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(chats[index].price)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment for "${chats[index].title}"...`)
    try {
      const result = await contract.methods
        .joinChat(index)
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully joined "${chats[index].title}".`)
      getChats()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    getMessages()
  }
  if (e.target.className.includes("viewChat")){
    chatId = e.target.id
    getMessages()
  }
})  

document.getElementById("sendMessage").addEventListener("click", async (e) => {
  const params = [
    chatId,
    document.getElementById("messageContent").value
  ]
  notification(`⌛ Sending message...`)
  try {
    const result = await contract.methods
      .sendMessage(...params)
      .send({ from: kit.defaultAccount })
  } catch (error) {
    notification(`⚠️ ${error}.`)
  }
  document.getElementById("messageContent").value = ""
  getMessages()
  notification(`🎉 Message sent successfully.`)
})