pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./myToken.sol";
import "hardhat/console.sol";
contract masterStake is Ownable{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct UserInfo{
        uint256 amount;
        uint256 rewardDebt;
    }

    struct PoolInfo{
        IERC20 lpToken;
        uint256 minAmount;
        uint256 weightage;
        uint256 lastRewardBlock;
        uint256 accRewardPerShare;
    }

    //Reward token!
    IERC20 public mToken;
    //Dev address.
    address public devaddr;
    //Rewards per block mined.
    uint256 public rewardPerBlock;
    //Bonus end block
    uint256 bonusEndBlock;
    //Bonus rewards multiplier
    uint256 BONUS_MULTIPLIER = 10;
    //Info of each pool.
    PoolInfo[] public poolInfo;
    //Info of each user in a pool.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    //Total weightage of all the pools.
    uint256 public totalWeightage = 0;
    //Block number from where token mining starts.
    uint256 public startBlock;
    //Locking period for the pools
    uint256 public lockingPeriod;

    // event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    // event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    // event EmergencyWithdraw(
    //     address indexed user,
    //     uint256 indexed pid,
    //     uint256 amount
 
    constructor(
        IERC20 _mToken,
        address _devaddr,
        uint256 _rewardPerBlock,
        uint256 _bonusEndBlock,
        uint256 _startBlock,
        uint256 _lockingPeriod
        ){
            mToken = _mToken;
            devaddr = _devaddr;
            rewardPerBlock = _rewardPerBlock;
            bonusEndBlock = _bonusEndBlock;
            startBlock = _startBlock;
            lockingPeriod = _lockingPeriod;
        }

    function poolLength()public view returns(uint256){
        return poolInfo.length;
    }

    //function to add a new LPToken to a Pool. (New pool creation)
    function add(
        uint256 _weightage,
        IERC20 _lpToken,
        uint256 _minAmount,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
         uint256 lastRewardBlock =
            block.number > startBlock ? block.number : startBlock;
        totalWeightage = totalWeightage.add(_weightage);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                minAmount: _minAmount,
                weightage: _weightage,
                lastRewardBlock: lastRewardBlock,
                accRewardPerShare: 0})
        );  
    }

    // Update the given pool's Token reward weightage and min amount. Can only be called by the owner.
    function set(
        uint256 _pid,
        uint256 _weightage,
        uint256 _minAmount,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalWeightage = totalWeightage.sub(poolInfo[_pid].weightage).add(_weightage);
        poolInfo[_pid].weightage = _weightage;
        poolInfo[_pid].minAmount = _minAmount;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to)
        public
        view
        returns (uint256)
    {
        if (_to <= bonusEndBlock) {
            return _to.sub(_from).mul(BONUS_MULTIPLIER);
        } else if (_from >= bonusEndBlock) {
            return _to.sub(_from);
        } else {
            return
                bonusEndBlock.sub(_from).mul(BONUS_MULTIPLIER).add(
                    _to.sub(bonusEndBlock)
                );
        }
    }

    // View function to see pending Rewards on frontend.
    function pendingRewards(uint256 _pid, address _user)
        external
        view
        returns (uint256)
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        console.log(block.number);
        console.log(pool.lastRewardBlock);
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier =
                getMultiplier(pool.lastRewardBlock, block.number);
            uint256 Reward =
                multiplier.mul(rewardPerBlock).mul(pool.weightage).div(
                    totalWeightage
                );
            accRewardPerShare = accRewardPerShare.add(
                Reward.mul(1e12).div(lpSupply)
            );
        }
        return user.amount.mul(accRewardPerShare).div(1e12).sub(user.rewardDebt);
    }

     // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 Reward =
            multiplier.mul(rewardPerBlock).mul(pool.weightage).div(
                totalWeightage
            );
        mToken.transfer(devaddr, Reward.div(10));
        mToken.transfer(address(this), Reward);
        pool.accRewardPerShare = pool.accRewardPerShare.add(
            Reward.mul(1e12).div(lpSupply)
        );
        pool.lastRewardBlock = block.number;
    }

    function deposit(uint256 _pid, uint256 _amount) public {
        // console.log("HERE 2");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        // console.log("HERE");
        require(_amount >= pool.minAmount, "MasterStake: Amount too low");
        if (user.amount > 0) {
            uint256 pending =
                user.amount.mul(pool.accRewardPerShare).div(1e12).sub(
                    user.rewardDebt
                );
            safeTokenTransfer(msg.sender, pending);
        }
        // console.log("HERE 1");
        pool.lpToken.safeTransferFrom(
            address(msg.sender),
            address(this),
            _amount
        );
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
    }

     function withdraw(uint256 _pid, uint256 _amount) public {
        require(block.timestamp > lockingPeriod, "MasterStake: Withdrawal locked");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending =
            user.amount.mul(pool.accRewardPerShare).div(1e12).sub(
                user.rewardDebt
            );
        safeTokenTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        pool.lpToken.safeTransfer(address(msg.sender), _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    // function emergencyWithdraw(uint256 _pid) public {
    //     require(block.timestamp >= lockingPeriod, "MasterStake: Withdrawal locked");
    //     PoolInfo storage pool = poolInfo[_pid];
    //     UserInfo storage user = userInfo[_pid][msg.sender];
    //     pool.lpToken.safeTransfer(address(msg.sender), user.amount);
    //     user.amount = 0;
    //     user.rewardDebt = 0;
    // }

    // Safe sushi transfer function, just in case if rounding error causes pool to not have enough SUSHIs.
    function safeTokenTransfer(address _to, uint256 _amount) internal {
        uint256 tokenBal = mToken.balanceOf(address(this));
        if (_amount > tokenBal) {
            mToken.transfer(_to, tokenBal);
        } else {
            mToken.transfer(_to, _amount);
        }
    }

     function dev(address _devaddr) public {
        require(msg.sender == devaddr, "dev: wut?");
        devaddr = _devaddr;
    }
    
}
