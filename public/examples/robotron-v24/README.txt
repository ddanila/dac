DACRX: original MIT example for Robotron TOS/M 1.0

1. Download the TOS/M copy with DACRX using the terminal panel.
2. Power off, mount that downloaded disk as writable A:, then boot it.
3. Enable Peer ready (CTS) and Connection present (DCD).
4. Use incoming framing Follow guest, or fixed 1200 baud / 8 / None / 1.
5. At the guest prompt enter DACRX NAME.EXT (a new, unused 8.3 filename).
6. Choose a file with Send XMODEM-128/checksum file. Watch the progress.
7. Export your modified disk to keep the result outside this browser.

Do not use Send raw file for this receiver. It expects XMODEM framing.
The receiver refuses existing filenames. Disk-full or create failure cancels.
A cancelled transfer may leave a partial file: erase it before trying again.
CP/M stores 128-byte records; the last record is padded with 1Ah bytes.
Clear received bytes before a long session; the capture limit is 64 KiB.
The example is qualified against emulated TOS/M, not a physical UART.

Receiver source: https://github.com/ddanila/dac-emulation/tree/main/examples/robotron-v24
Protocol: Ward Christensen's XMODEM-128/checksum (ACK=06h).
The downloaded disk retains the stock-media notice in media/robotron/NOTICE.txt;
the original DACRX.COM addition is MIT licensed.

Guest-to-browser transfer:
The generated transfer disk also includes DACTX.COM (original MIT source in
 dac-emulation/examples/robotron-v24/build-tx.py).
Choose Receive XMODEM file from guest, then run DACTX NAME.EXT in TOS/M.
Use 1200 baud, 8 data bits, no parity, one stop bit, CTS and DCD enabled.
Downloads preserve CP/M's 128-byte record padding; the protocol does not
carry the original byte length. Maximum receive size is 64 KiB.
