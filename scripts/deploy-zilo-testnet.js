const { getDefaultAccount } = require('./account')
const { getContract, callContract, getBlockNum } = require('./call.js')
const { deployZILO, deploySeedLP } = require('./deploy')

const deploy = async () => {
  const owner = getDefaultAccount()

  console.log("deploying from", owner.address)

  const bNum = await getBlockNum()
  const tokenAddress = '0x4fdc0e9b17871b8ed7c3205c0f9f59643dcd00d1'
  const zwapAddress = '0xb2b119e2496f24590eff419f15aa1b6e82aa7074'

  // deploy seed lp
  const [lp, stateLP] = await deploySeedLP(owner.key, {
    tokenAddress,
    zilswapAddress: '0x1a62dd9c84b0c8948cb51fc664ba143e7a34985c',
  })

  console.log('Deployed seed lp contract:')
  console.log(JSON.stringify(lp, null, 2))
  console.log('State:')
  console.log(JSON.stringify(stateLP, null, 2))

  // deploy zilo
  const zilDecimals = '0000000000' // shifted -2 for easier completion **NOTE**
  const tknDecimals = '00000000'
  const receiverAddress = '0x9a8d50d1811d5276e57a4c4c159d3282b2b59ff4' // https://devex.zilliqa.com/address/zil1n2x4p5vpr4f8det6f3xpt8fjs2ett8l5p0cnx0?network=https%3A%2F%2Fapi.zilliqa.com
  const [zilo, state] = await deployZILO(owner.key, {
    zwapAddress,
    tokenAddress,
    tokenAmount:             '250000000' + tknDecimals, // TOKEN 250m
    targetZilAmount:           '2660000' + zilDecimals, // ZIL 2.66m (~$292.6K @ $0.11)
    targetZwapAmount:             '2180' + zilDecimals, // ZWAP 2.18k (~$32.4k @$14.9)
    minimumZilAmount:           '664000' + zilDecimals, // ZIL 664k (25% of target)
    liquidityZilAmount:        '2659999' + zilDecimals, // ZIL 2.66m (tknPrice*liquidity/zilPrice)
    liquidityTokenAmount:    '225076838' + tknDecimals, // TOKEN 225m
    receiverAddress:                   receiverAddress,
    liquidityAddress:         lp.address.toLowerCase(),
    startBlock:                (bNum + 100).toString(), // 1 hrs, 100 blocks an hr
    endBlock:                  (bNum + 500).toString(), // 6 hrs, hopefully
  })

  console.log('Deployed zilo contract:')
  console.log(JSON.stringify(zilo, null, 2))
  console.log('State:')
  console.log(JSON.stringify(state, null, 2))

  // approve burn of zwap on zilo
  const zwap = getContract(zwapAddress)
  const result = await callContract(
    owner.key, zwap,
    'AddMinter',
    [
      {
        vname: 'minter',
        type: 'ByStr20',
        value: zilo.address.toLowerCase(),
      },
    ],
    0, false, false
  )

  console.log('Approved burn of zwap:')
  console.log(JSON.stringify(result, null, 2))

  // // send tkns to zilo
  // const tkn = getContract(tokenAddress)
  // const result2 = await callContract(
  //   owner.key, tkn,
  //   'Transfer',
  //   [
  //     {
  //       vname: 'to',
  //       type: 'ByStr20',
  //       value: zilo.address.toLowerCase(),
  //     },
  //     {
  //       vname: 'amount',
  //       type: 'Uint128',
  //       value: '450000000' + tknDecimals,
  //     },
  //   ],
  //   0, false, false
  // )

  // console.log('Sent tkns to zilo:')
  // console.log(JSON.stringify(result2, null, 2))

}

deploy().then(() => console.log('Done.'))
