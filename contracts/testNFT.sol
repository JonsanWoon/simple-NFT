pragma solidity ^0.5.8;
import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/drafts/Counters.sol";

contract testNFT is ERC721Full,Ownable,ERC721Burnable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenId;

    string public name;
    string public symbol;
    mapping(address => uint256)id;
    
    constructor( string memory _name, string memory _symbol) ERC721Full(_name, _symbol)public{
        name=_name;
        symbol=_symbol;
    }

    function mint(address to, string memory uri)payable public onlyOwner{
        require(to !=address(0));
        require(msg.sender !=address(0));
        _tokenId.increment();
        uint256 newTokenId = _tokenId.current();
         _mint(to, newTokenId);
        _setTokenURI(newTokenId,uri);
    }
}
