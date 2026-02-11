# Speecher Linux Agent

Receives transcriptions from backend and auto-pastes at cursor position on X11 desktops.

## Prerequisites

1. **X11 Desktop** - Wayland is not supported
2. **xdotool** - For keyboard simulation
3. **Node.js 18+** - Runtime environment

### Installing xdotool

Ubuntu/Debian:
```bash
sudo apt-get install xdotool
```

Fedora:
```bash
sudo dnf install xdotool
```

Arch Linux:
```bash
sudo pacman -S xdotool
```

### Verifying X11

Ensure you're running in an X11 session:
```bash
echo $DISPLAY  # Should show :0 or similar
```

## Installation

```bash
cd linux-agent
npm install
npm run build
```

## Usage

```bash
# Default: connects to wss://speecher.objetiva.com.ar/ws
npm start

# Or with custom server URL:
SPEECHER_SERVER_URL=ws://192.168.1.100:3000/ws npm start
```

### Expected Output

When starting successfully, you'll see:
```
{"level":30,"name":"speecher-agent","msg":"Starting Speecher Linux Agent",...}
{"level":30,"name":"speecher-agent","msg":"Dependencies validated: DISPLAY set, xdotool available"}
{"level":30,"name":"agent-connection","msg":"Connecting to backend",...}
{"level":30,"name":"agent-connection","msg":"Registered with backend",...}
```

## Development

```bash
npm run dev  # Watch mode with hot reload and pretty logging
```

## How It Works

1. Agent connects to backend WebSocket server
2. Registers this device with its hostname
3. Listens for transcription messages from mobile app
4. When text arrives:
   - Copies text to clipboard
   - Simulates Ctrl+V keystroke using xdotool
   - Text appears at current cursor position

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SPEECHER_SERVER_URL` | `wss://speecher.objetiva.com.ar/ws` | Backend WebSocket URL |

## Troubleshooting

### "DISPLAY environment variable not set"

You're running in a headless environment without X11. The agent requires a graphical desktop session.

**Solutions:**
- Run this on a desktop with a graphical session
- If using SSH, enable X forwarding: `ssh -X user@host`

### "xdotool not found"

Install xdotool using your package manager (see Prerequisites above).

### "Cannot open display"

DISPLAY is set but X11 connection failed.

**Solutions:**
- Ensure you're running in a graphical session, not SSH without X forwarding
- Check X11 is running: `xset q`

### Connection errors

- Verify the backend URL is correct
- Check network connectivity to the server
- Ensure no firewall blocks WebSocket connections

### Text not pasting

- Ensure cursor is in a text input field
- Some applications may not accept Ctrl+V paste
- Check clipboard content: `xclip -selection clipboard -o`
