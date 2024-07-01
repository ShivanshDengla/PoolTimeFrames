import React, { useState, useEffect } from "react";
import Select from "react-select"; // Assuming you're using react-select for the dropdown
import Image from "next/image"; // If you're using Next.js Image component
import donut from "/public/images/pooltogether.png";
import Layout from "./index";
import { ADDRESS } from "../constants/address";
import { NumberWithCommas, CropDecimals } from "../utils/tokenMaths";
import { ethers } from "ethers";
import { GetChainName } from "../utils/getChain";
import { CONFIG } from "../constants/config";

type Vault = {
  vault: string;
  poolers: number;
};

type Player = {
  address: string;
  balance: string;
};

type Chain = {
  id: string;
  name: string;
};

function parseAmount(amount: any, decimals: any) {
  return parseFloat(amount) / 10 ** decimals;
}

function Poolers() {
  const chains: Chain[] = [
    // { id: '11155111', name: 'SEPOLIA' },
    { id: '42161', name: 'ARBITRUM'},
    { id: '8453', name: 'BASE' },
    { id: CONFIG.CHAINID.toString(), name: CONFIG.CHAINNAME },
  ];
  // function getChainNameById(chainId: any) {
  //   const chain = chains.find((c) => c.id === chainId);
  //   return chain ? chain.name : chains[0];
  // }

  const [selectedChain, setSelectedChain] = useState(chains[0].id);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState("");
  const [poolers, setPoolers] = useState<Player[]>([]);
  const [popup, setPopup] = useState<boolean>(true);
  useEffect(() => {
    setPopup(true);
    const poolersUrl = `https://poolexplorer.xyz/${selectedChain}-${ADDRESS[GetChainName(Number(selectedChain))].PRIZEPOOL}-poolers`
    // console.log(poolersUrl)
    fetch(
      poolersUrl
    )
      .then((response) => response.json())
      .then((data) => {
        const sortedVaults = [...data].sort((a, b) => b.poolers - a.poolers);
        // Extract the addresses of the vaults for the selected chain
        const chainVaultAddresses = ADDRESS[
          GetChainName(Number(selectedChain))
        ].VAULTS.map((v: any) => v.VAULT.toLowerCase());

        // Filter the vaults based on their address
        // console.log("sorted vaults",sortedVaults)
        const filteredVault = sortedVaults.filter((vault) =>
          chainVaultAddresses.includes(vault.vault)
        );
        setVaults(filteredVault);

        if (sortedVaults.length && !selectedVault) {
          setSelectedVault(sortedVaults[0].vault);
        }
        setPopup(false); // Hide popup after data has been processed
      });
  }, [selectedChain]);

  useEffect(() => {
    if (selectedVault) {
     
      fetch(
        `https://poolexplorer.xyz/vault-${selectedVault}-poolers`
      )
        .then((response) => response.json())
        .then((data) => {
          // console.log("poolers data", data);
          const sortedPoolers = data.sort(
            (a: any, b: any) => parseFloat(b.balance) - parseFloat(a.balance)
          );

          setPoolers(sortedPoolers);
        });
    }
  }, [selectedChain, selectedVault]);
  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      borderRadius: "10px", // Change the border radius value as per your needs
    }),
  };

  function getVaultDetails(vaultAddress: string) {
    const chainName = GetChainName(Number(selectedChain));
    if (chainName && ADDRESS[chainName] && ADDRESS[chainName].VAULTS) {
      return ADDRESS[chainName].VAULTS.find(
        (vault) => vault.VAULT.toLowerCase() === vaultAddress.toLowerCase()
      );
    }
    return null;
  }
  interface CustomOptionData {
    icon?: string;
    label: string;
  }
  interface CustomOptionProps {
    data: CustomOptionData;
    className?: string;
    // Add other props of the div that you may need
  }

  const CustomOption: React.FC<CustomOptionProps> = ({ data, ...props }) => (
    <div {...props}>
      {data.icon && (
        <img
          src={data.icon}
          alt={data.label}
          style={{ width: "20px", marginRight: "10px" }}
        />
      )}
      {data.label}
    </div>
  );

  const selectedVaultDetails = getVaultDetails(selectedVault);

  const totalValueLocked = poolers.reduce((acc, item) => {
    return selectedVaultDetails
      ? acc +
          parseFloat(
            ethers.utils.formatUnits(
              item.balance,
              selectedVaultDetails.DECIMALS
            )
          )
      : acc;
  }, 0);

  return (
    <Layout>
      <center>
        {!popup ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Image
                src={`/images/diving.png`}
                height={105}
                width={105}
                alt="poolers"
                style={{ verticalAlign: "middle" }}
              />
              <h1 style={{ margin: "0 0 0 10px", lineHeight: "120px" }}>
                POOLERS
              </h1>
            </div>

            <div
              className="clear-container padding-top-bottom-20 border-radius-20"
              style={{ backgroundColor: "white" }}>
              <div style={{ padding: "5px" }}>
                <div style={{ display: "inline-block", paddingRight: "10px" }}>
                  <Select
                    styles={customStyles}
                    options={chains.map((chain) => ({
                      label: chain.name,
                      value: chain.id,
                    }))}
                    className="select-testnet-chain"
                    onChange={(e: any) => setSelectedChain(e.value)}
                    value={{
                      label:
                        chains.find((chain) => chain.id === selectedChain)
                          ?.name || "",
                      value: selectedChain,
                    }}
                  />
                </div>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <div style={{ display: "inline-block" }}>
                  <Select
                    styles={customStyles}
                    options={vaults.map((vault) => {
                      const details = getVaultDetails(vault.vault);
                      const icon = details ? details.ICON : null;
                      const symbol = details ? details.SYMBOL : vault.vault;
                      return {
                        label: `${symbol} - ${vault.poolers} poolers`,
                        value: vault.vault,
                        icon,
                      };
                    })}
                    className="select-testnet"
                    onChange={(e: any) => setSelectedVault(e.value)}
                    value={{
                      label: `${
                        selectedVaultDetails
                          ? selectedVaultDetails.SYMBOL
                          : selectedVault
                      } - ${
                        vaults.find((v) => v.vault === selectedVault)
                          ?.poolers || ""
                      } poolers`,
                      value: selectedVault,
                    }}
                  />
                </div>
              </div>
            </div>

            {selectedVaultDetails && (
              <div className="stats-container">
                <div className="vault-name">
                  {selectedVaultDetails.NAME.replace(
                    /PoolTogether|Prize Token/g,
                    ""
                  ).trim()}{" "}
                  Vault&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </div>
                <div className="stats hidden-mobile" style={{ color: "white" }}>
                  <div className="stat">
                    <div className="stat-details">
                      Poolers&nbsp;&nbsp;
                      <span className="stat-value-poolers">
                        {NumberWithCommas(poolers.length.toString())}
                      </span>
                    </div>
                  </div>
                </div>
                {totalValueLocked > 0 && (
                  <div
                    className="stats hidden-mobile"
                    style={{ color: "white" }}>
                    <div className="stat">
                      <div className="stat-details">
                        TVL&nbsp;&nbsp;
                        <Image
                          src={selectedVaultDetails.ICON}
                          alt={selectedVaultDetails.SYMBOL}
                          width={20}
                          height={20}
                        />
                        &nbsp;
                        <span className="stat-value-poolers">
                          {NumberWithCommas(
                            Math.round(totalValueLocked).toString()
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="win-container">
              <div style={{ maxWidth: "1100px" }}>
                <table className="claims-table">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th style={{ textAlign: "right" }}>
                        Balance&nbsp;&nbsp;&nbsp;&nbsp;
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolers.map((player, index) => (
                      <tr key={index}>
                        <td>
                          <span className="hidden-mobile">
                            {player.address}
                          </span>
                          <span className="hidden-desktop">
                            {player.address && player.address.substring(0, 8)}
                          </span>
                        </td>
                        <td className="amount" style={{ textAlign: "right" }}>
                          {selectedVaultDetails && (
                            <>
                              <Image
                                src={selectedVaultDetails.ICON}
                                alt={selectedVaultDetails.SYMBOL}
                                width={16}
                                height={16}
                              />
                              &nbsp;
                              {NumberWithCommas(
                                CropDecimals(
                                  parseAmount(
                                    player.balance,
                                    selectedVaultDetails.DECIMALS
                                  )
                                )
                              )}
                              &nbsp;&nbsp;&nbsp;
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <style jsx>{`
              .amount {
                white-space: nowrap;
              }
              .win-container {
                margin-top: 5px;
              }

              .claims-table {
                border-collapse: collapse;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 1500px;
              }

              .stat-details {
                display: flex;
                align-items: center; // This will vertically center the items
              }
              .stat-value-poolers {
                font-size: 28px;
              }
              .stat-value {
                margin-left: 10px; // Adjust this value based on your design
              }
              .claims-table th,
              .claims-table td {
                padding: 16px;
                text-align: left;
                background-color: #f7f7f7;
                border-bottom: 1px solid #ebebeb;
              }

              .claims-table th:first-child,
              .claims-table td:first-child {
                padding-left: 24px;
              }

              .claims-table th:last-child,
              .claims-table td:last-child {
                padding-right: 24px;
              }

              .stats-container {
                display: flex;
                justify-content: center; // Align items to the start of the container
                align-items: flex-end; // Vertically align items to the bottom
                flex-wrap: no-wrap; // Keep items on the same row
                padding-top: 15px;
              }

              .vault-name {
                align-self: flex-end;
                font-size: 25px;
                weight: 400;
                color: white;
                padding-bottom: 20px;
              }

              .stat-value {
                font-weight: 500;
                padding-top: 5px;
                font-size: 18px;
                display: inline-flex;
                align-items: center;
                vertical-align: middle;
                text-align: left; /* Align the value to the left */
              }
              .stat {
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              .amount-header,
              .amount {
                text-align: right;
              }
            `}</style>
          </>
        ) : (
          <div className="loading-animation">
            <div className="loading-image">
              <Image src={donut} alt="Loading" priority={true} />
            </div>
          </div>
        )}{" "}
      </center>
    </Layout>
  );
}

export default Poolers;
