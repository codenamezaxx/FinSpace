import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FinnyInput from "./FinnyInput";

describe("FinnyInput", () => {
  it("calls onSend when send button clicked", () => {
    const onSend = vi.fn();
    render(<FinnyInput onSend={onSend} isLoading={false} isOffline={false} />);
    const input = screen.getByPlaceholderText("Ketik pesan...");
    fireEvent.change(input, { target: { value: "halo" } });
    const sendBtn = screen.getByLabelText("Kirim pesan");
    fireEvent.click(sendBtn);
    expect(onSend).toHaveBeenCalledWith("halo");
  });

  it("calls onSend on Enter key", () => {
    const onSend = vi.fn();
    render(<FinnyInput onSend={onSend} isLoading={false} isOffline={false} />);
    const input = screen.getByPlaceholderText("Ketik pesan...");
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("test");
  });

  it("disables send button when loading", () => {
    const onSend = vi.fn();
    render(<FinnyInput onSend={onSend} isLoading={true} isOffline={false} />);
    const input = screen.getByPlaceholderText("Ketik pesan...");
    fireEvent.change(input, { target: { value: "halo" } });
    const sendBtn = screen.getByLabelText("Kirim pesan");
    fireEvent.click(sendBtn);
    expect(onSend).not.toHaveBeenCalled();
    expect(input.hasAttribute("disabled")).toBe(true);
  });

  it("shows offline indicator when offline", () => {
    render(<FinnyInput onSend={vi.fn()} isLoading={false} isOffline={true} />);
    expect(screen.getByText("Offline")).toBeDefined();
  });
});

describe("FinnyInput scan button", () => {
  it("renders camera button when onScan provided", () => {
    render(<FinnyInput onSend={vi.fn()} isLoading={false} isOffline={false} onScan={vi.fn()} />);
    const cameraBtn = screen.getByLabelText("Scan struk");
    expect(cameraBtn).toBeDefined();
  });

  it("calls onScan when camera button clicked", () => {
    const onScan = vi.fn();
    render(<FinnyInput onSend={vi.fn()} isLoading={false} isOffline={false} onScan={onScan} />);
    const cameraBtn = screen.getByLabelText("Scan struk");
    fireEvent.click(cameraBtn);
    expect(onScan).toHaveBeenCalled();
  });

  it("disables camera button when loading", () => {
    render(<FinnyInput onSend={vi.fn()} isLoading={true} isOffline={false} onScan={vi.fn()} />);
    const cameraBtn = screen.getByLabelText("Scan struk");
    expect(cameraBtn.hasAttribute("disabled")).toBe(true);
  });
});
