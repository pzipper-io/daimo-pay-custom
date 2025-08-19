"use client";

import { DaimoPayButton, useDaimoPayUI, waitingPaymentLayoutProps } from "@daimo/pay";
import * as Tokens from "@daimo/pay-common";
import {
  knownTokens,
  DepositAddressPaymentOptions,
} from "@daimo/pay-common";
import { useCallback, useEffect, useState } from "react";
import { getAddress } from "viem";
import { Text, TextLink } from "../../shared/tailwind-catalyst/text";
import CodeSnippet from "../code-snippet";
import { APP_ID, Container, printEvent, usePersistedConfig } from "../shared";

type Config = {
  recipientAddress: string;
  chainId: number;
  tokenAddress: string;
  amount: string;
  forcePayToAddress: boolean;
  selectedDepositOption: DepositAddressPaymentOptions;
};

export default function DemoExtendPay() {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = usePersistedConfig("daimo-extend-pay-config", {
    recipientAddress: "",
    chainId: 0,
    tokenAddress: "",
    amount: "",
    forcePayToAddress: false,
    selectedDepositOption: DepositAddressPaymentOptions.BASE,
  } as Config);
  const [codeSnippet, setCodeSnippet] = useState("");
  const { resetPayment } = useDaimoPayUI();

  const handleSetConfig = useCallback((newConfig: Config) => {
    setConfig(newConfig);
    resetPayment({
      toChain: newConfig.chainId,
      toAddress: getAddress(newConfig.recipientAddress),
      toToken: getAddress(newConfig.tokenAddress),
      toUnits: newConfig.amount,
    });
  }, [setConfig, resetPayment]);

  // Only render the DaimoPayButton when we have valid config
  const hasValidConfig =
    config && config.recipientAddress && config.chainId && config.tokenAddress && config.amount;

  // Add escape key handler
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isConfigOpen) {
        setIsConfigOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isConfigOpen]);

  const waitingPaymentLayout = (props: waitingPaymentLayoutProps) => {
    console.log('waitingPaymentLayout, -->>>>', props);
    return <div>
      <Text className="text-lg text-gray-700 mb-4"  >
        hahaha
      </Text>
      <Text className="text-lg text-gray-700 mb-4"  >
        {props.depAddr?.address}
      </Text>
      <Text className="text-lg text-gray-700 mb-4"  >
        {props.depAddr?.amount}
      </Text>
      <Text className="text-lg text-gray-700 mb-4"  >
        {props.depAddr?.coins}
      </Text>
    </div>
  }

  useEffect(() => {
    if (!hasValidConfig) {
      setCodeSnippet("");
      return;
    }

    const token = knownTokens.find(
      (t) => t.token === config.tokenAddress && t.chainId === config.chainId,
    );
    if (!token) return;

    const tokenVarName =
      Object.entries(Tokens).find(([_, t]) => t === token)?.[0] || token.symbol;

    const forcePayToAddressCode = config.forcePayToAddress
      ? `
  forcePayToAddress={{
    forceSenderChain: DepositAddressPaymentOptions.${config.selectedDepositOption},
  }}`
      : "";

    const snippet = `import { ${tokenVarName}, DepositAddressPaymentOptions } from "@daimo/pay-common";

<DaimoPayButton.Custom
  appId="${APP_ID}"
  toChain={${tokenVarName}.chainId}
  toAddress={getAddress("${config.recipientAddress}")}
  toToken={getAddress(${tokenVarName}.token)}
  toUnits={"${config.amount}"}
  intent="Pay"${forcePayToAddressCode}
>
  {({ show }) => (
    <button onClick={show} className="pay-button">
      Pay
    </button>
  )}
</DaimoPayButton.Custom>`;
    setCodeSnippet(snippet);
  }, [config, hasValidConfig]);

  return (
    <Container className="max-w-4xl mx-auto p-6">
      <Text className="text-lg text-gray-700 mb-4">
        這個示例展示了如何使用擴展付款功能，包括強制付款方法選擇。
      </Text>

      <div className="flex flex-col items-center gap-8">
        {hasValidConfig ? (
          <>
            <DaimoPayButton.Custom
              appId={APP_ID}
              toChain={config.chainId}
              toAddress={getAddress(config.recipientAddress)}
              toToken={getAddress(config.tokenAddress)}
              toUnits={config.amount}
              intent="Pay"
              forcePayToAddress={config.forcePayToAddress ? {
                forceSenderChain: config.selectedDepositOption,
              } : undefined}
              waitingPaymentLayout={waitingPaymentLayout}
              onPaymentStarted={printEvent}
              onPaymentCompleted={(e) => {
                printEvent(e);
                setTxHash(e.txHash);
              }}
            >
              {({ show }) => (
                <button
                  onClick={show}
                  className="bg-green-dark text-white px-6 py-3 rounded-lg hover:bg-green-medium transition-all"
                >
                  Pay
                </button>
              )}
            </DaimoPayButton.Custom>
            
            {txHash && (
              <TextLink
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                className="text-green-medium hover:text-green-dark"
              >
                Transaction Successful ↗
              </TextLink>
            )}
            
            <button
              onClick={() => setIsConfigOpen(true)}
              className="bg-green-dark text-white px-6 py-3 rounded-lg hover:bg-green-medium transition-all"
            >
              設定擴展付款
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsConfigOpen(true)}
            className="bg-green-dark text-white px-6 py-3 rounded-lg hover:bg-green-medium transition-all"
          >
            建立擴展付款
          </button>
        )}

        {hasValidConfig && (
          <div className="w-full">
            <Text className="text-lg font-medium text-green-dark mb-2">
              實作代碼
            </Text>
            <CodeSnippet codeSnippet={codeSnippet} />
          </div>
        )}

        <ExtendPayConfigPanel
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onConfirm={handleSetConfig}
          defaultConfig={config}
        />
      </div>
    </Container>
  );
}

// 自訂設定面板組件
function ExtendPayConfigPanel({
  isOpen,
  onClose,
  onConfirm,
  defaultConfig,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: Config) => void;
  defaultConfig: Config;
}) {
  const [config, setConfig] = useState<Config>(defaultConfig);

  useEffect(() => {
    setConfig(defaultConfig);
  }, [defaultConfig]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <Text className="text-lg font-semibold mb-4">設定擴展付款</Text>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              收款地址
            </label>
            <input
              type="text"
              value={config.recipientAddress}
              onChange={(e) => setConfig({ ...config, recipientAddress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              鏈 ID
            </label>
            <select
              value={config.chainId}
              onChange={(e) => setConfig({ ...config, chainId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={0}>選擇鏈</option>
              <option value={8453}>Base (8453)</option>
              <option value={1}>Ethereum (1)</option>
              <option value={137}>Polygon (137)</option>
              <option value={42161}>Arbitrum (42161)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              代幣地址
            </label>
            <input
              type="text"
              value={config.tokenAddress}
              onChange={(e) => setConfig({ ...config, tokenAddress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0x0 for native token"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              付款金額
            </label>
            <input
              type="text"
              value={config.amount}
              onChange={(e) => setConfig({ ...config, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="1.0"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.forcePayToAddress}
                onChange={(e) => setConfig({ ...config, forcePayToAddress: e.target.checked })}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">強制使用指定付款方式</span>
            </label>
          </div>

          {config.forcePayToAddress && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                強制付款方式
              </label>
              <select
                value={config.selectedDepositOption}
                onChange={(e) => setConfig({ ...config, selectedDepositOption: e.target.value as DepositAddressPaymentOptions })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={DepositAddressPaymentOptions.BASE}>Base</option>
                <option value={DepositAddressPaymentOptions.ARBITRUM}>Arbitrum</option>
                <option value={DepositAddressPaymentOptions.ETH_L1}>Ethereum</option>
                <option value={DepositAddressPaymentOptions.POLYGON}>Polygon</option>
                <option value={DepositAddressPaymentOptions.OP_MAINNET}>Optimism</option>
                <option value={DepositAddressPaymentOptions.TRON_USDT}>USDT on Tron</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm(config);
              onClose();
            }}
            className="px-4 py-2 bg-green-dark text-white rounded-lg hover:bg-green-medium"
          >
            確認
          </button>
        </div>
      </div>
    </div>
  );
} 