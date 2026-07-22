import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CameraOverlay from "./CameraOverlay";
import type { CameraOverlayProps } from "./CameraOverlay";

// Mock getUserMedia
const mockGetUserMedia = vi.fn();
Object.defineProperty(navigator, "mediaDevices", {
  value: { getUserMedia: mockGetUserMedia },
  configurable: true,
});

// Mock MediaStream
class MockMediaStream {
  getTracks() { return [{ stop: vi.fn() }]; }
}

describe("CameraOverlay", () => {
  const defaultProps: CameraOverlayProps = {
    isOpen: false,
    onCapture: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(new MockMediaStream());
  });

  it("renders nothing when closed", () => {
    const { container } = render(<CameraOverlay {...defaultProps} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders camera view when open", async () => {
    render(<CameraOverlay {...defaultProps} isOpen={true} />);
    expect(screen.getByLabelText("Ambil foto")).toBeDefined();
    expect(screen.getByLabelText("Pilih dari galeri")).toBeDefined();
    expect(screen.getByLabelText("Tutup kamera")).toBeDefined();
  });

  it("calls getUserMedia on open", async () => {
    render(<CameraOverlay {...defaultProps} isOpen={true} />);
    await vi.waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledOnce();
    });
  });

  it("shows no-camera state when getUserMedia fails", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("permission denied"));
    render(<CameraOverlay {...defaultProps} isOpen={true} />);
    await vi.waitFor(() => {
      expect(screen.getByText("Pilih dari Galeri")).toBeDefined();
    });
  });

  it("shows preview after capture, then calls onCapture on confirm", async () => {
    render(<CameraOverlay {...defaultProps} isOpen={true} />);

    // Mock canvas getContext (jsdom doesn't implement it) and toDataURL
    const mockToDataURL = vi.fn().mockReturnValue("data:image/jpeg;base64,fake");
    HTMLCanvasElement.prototype.toDataURL = mockToDataURL;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    // Click capture
    const captureBtn = screen.getByLabelText("Ambil foto");
    fireEvent.click(captureBtn);

    // Should show preview state
    await vi.waitFor(() => {
      expect(screen.getByText("Gunakan")).toBeDefined();
      expect(screen.getByText("Ulangi")).toBeDefined();
    });

    // Click confirm
    const confirmBtn = screen.getByText("Gunakan");
    fireEvent.click(confirmBtn);

    expect(defaultProps.onCapture).toHaveBeenCalledWith("data:image/jpeg;base64,fake");
  });

  it("stops camera tracks on close", async () => {
    const stopTrack = vi.fn();
    mockGetUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });

    const { rerender } = render(<CameraOverlay {...defaultProps} isOpen={true} />);
    await vi.waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    rerender(<CameraOverlay {...defaultProps} isOpen={false} />);
    expect(stopTrack).toHaveBeenCalled();
  });

  it("calls onClose on Escape key", () => {
    render(<CameraOverlay {...defaultProps} isOpen={true} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
