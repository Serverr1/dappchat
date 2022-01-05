// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract ChatGroups {
    uint256 internal chatsLength = 0;
    uint256 internal messagesLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;


    struct Message {
        address creator;
        string content;
    }


    struct Chat {
        address payable owner;
        string title;
        string description;
         string rules;
        uint256 price;
        address[] participants;
        uint256[] messages;
       
    }



    mapping(uint256 => Chat) internal chats;

    mapping(uint256 => Message) internal messages;



    function createChat(
        string memory _title,
        string memory _description,
        string memory _rules,
        uint256 _price
    ) public {
        address[] memory _participants;
        uint256[] memory _messages;
        chats[chatsLength] = Chat(
            payable(msg.sender),
            _title,
            _description,
            _rules,
            _price,
            _participants,
            _messages
        );
        chats[chatsLength].participants.push(msg.sender);
        chatsLength++;
    }

    function sendMessage(uint256 _index, string memory _content) public {
        chats[_index].messages.push(messagesLength);
        messages[messagesLength] = Message(msg.sender, _content);
        messagesLength++;
    }

    function getChat(uint256 _index)
        public
        view
        returns (
            address payable,
            string memory,
            string memory,
            uint256,
            address[] memory,
            uint256[] memory
        )
    {
        return (
            chats[_index].owner,
            chats[_index].title,
            chats[_index].description,
            chats[_index].price,
            chats[_index].participants,
            chats[_index].messages
        );
    }

    function removeParticipant(uint _chatindex, uint _participantindex ) public{
        require(chats[_chatindex].owner == msg.sender, "Only the creator can remove participant" );
        delete chats[_chatindex].participants[_participantindex];

        
    }

    function getMessages(uint256 _index)
        public
        view
        returns (uint256[] memory)
    {
        return (chats[_index].messages);
    }

    function getMessage(uint256 _index)
        public
        view
        returns (address, string memory)
    {
        return (messages[_index].creator, messages[_index].content);
    }

    function joinChat(uint256 _index) public payable {
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                chats[_index].owner,
                chats[_index].price
            ),
            "Transfer failed."
        );
        chats[_index].participants.push(msg.sender);
    }

    function getChatsLength() public view returns (uint256) {
        return (chatsLength);
    }

    function getMessagesLength() public view returns (uint256) {
        return (messagesLength);
    }
}
