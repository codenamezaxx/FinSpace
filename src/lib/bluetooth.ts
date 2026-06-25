/**
 * Web Bluetooth utility for thermal receipt printing (ESC/POS).
 */

export interface ReceiptData {
  merchant: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  paymentMethod: string;
  date: string;
}

const THERMAL_SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb";
const THERMAL_CHARACTERISTIC_UUID = "00002af1-0000-1000-8000-00805f9b34fb";

/**
 * Request a Bluetooth printer device from the user.
 * Must be called from a user gesture (button click).
 */
export async function requestPrinter(): Promise<BluetoothDevice | null> {
  if (!navigator.bluetooth) {
    console.warn("Web Bluetooth is not supported in this browser.");
    return null;
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [THERMAL_SERVICE_UUID],
    });
    return device;
  } catch (err) {
    if ((err as DOMException).name === "NotFoundError") {
      console.log("No printer selected.");
      return null;
    }
    throw err;
  }
}

/**
 * Connect to a Bluetooth device and get the printer characteristic.
 */
async function connectToPrinter(
  device: BluetoothDevice
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  const server = await device.gatt?.connect();
  if (!server) return null;

  const service = await server.getPrimaryService(THERMAL_SERVICE_UUID);
  const characteristic = await service.getCharacteristic(THERMAL_CHARACTERISTIC_UUID);
  return characteristic;
}

/**
 * Convert text to ESC/POS formatted bytes.
 */
function encodeESCPOS(text: string): Uint8Array {
  const encoder = new TextEncoder();
  const lines = text.split("\n");
  const chunks: Uint8Array[] = [];

  // Initialize printer
  chunks.push(new Uint8Array([0x1b, 0x40])); // ESC @

  // Center alignment
  chunks.push(new Uint8Array([0x1b, 0x61, 0x01])); // ESC a 1

  for (const line of lines) {
    const encoded = encoder.encode(line + "\n");
    chunks.push(encoded);
  }

  // Cut paper (partial cut)
  chunks.push(new Uint8Array([0x1d, 0x56, 0x01])); // GS V 1

  // Calculate total length
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Format transaction data as a receipt text string.
 */
export function generateReceiptText(data: ReceiptData): string {
  const line = "================================";
  return [
    line,
    "       FINSPACE RECEIPT",
    line,
    "",
    `Merchant: ${data.merchant}`,
    `Type:     ${data.type === "expense" ? "EXPENSE" : "INCOME"}`,
    `Amount:   Rp${data.amount.toLocaleString("id-ID")}`,
    `Category: ${data.category}`,
    `Payment:  ${data.paymentMethod}`,
    `Date:     ${data.date}`,
    "",
    line,
    "    Terima kasih!",
    line,
    "",
  ].join("\n");
}

/**
 * Print a receipt via Bluetooth thermal printer.
 * Must be called from a user gesture.
 */
export async function printReceipt(
  receiptData: ReceiptData
): Promise<{ success: boolean; error?: string }> {
  try {
    const device = await requestPrinter();
    if (!device) {
      return { success: false, error: "No printer selected" };
    }

    const characteristic = await connectToPrinter(device);
    if (!characteristic) {
      return { success: false, error: "Failed to connect to printer" };
    }

    const text = generateReceiptText(receiptData);
    const data = encodeESCPOS(text);
    await characteristic.writeValue(data as unknown as BufferSource);

    // Disconnect
    device.gatt?.disconnect();

    return { success: true };
  } catch (err) {
    console.error("Bluetooth print error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Check if Web Bluetooth is available in this browser.
 */
export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}
