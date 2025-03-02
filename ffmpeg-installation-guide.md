# FFmpeg Installation Guide

This application uses FFmpeg for audio processing. Here's how to install it on your system:

## Windows

### Method 1: Using the Official Build

1. Download the latest build from [FFmpeg's official website](https://ffmpeg.org/download.html#build-windows)

   - Select the "Windows builds" link
   - Download the "release full" build (64-bit)

2. Extract the ZIP file to a location like `C:\ffmpeg`

3. Add FFmpeg to your PATH:

   - Right-click "This PC" or "My Computer" and select "Properties"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add the path to FFmpeg's bin directory (e.g., `C:\ffmpeg\bin`)
   - Click "OK" on all dialogs to save

4. Verify installation:
   - Open a new Command Prompt and run:
   ```
   ffmpeg -version
   ```

### Method 2: Using Chocolatey Package Manager

If you have [Chocolatey](https://chocolatey.org/) installed:

1. Open an administrator Command Prompt
2. Run:
   ```
   choco install ffmpeg
   ```
3. Verify installation:
   ```
   ffmpeg -version
   ```

## macOS

### Using Homebrew

1. If you don't have Homebrew, install it:

   ```
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install FFmpeg:

   ```
   brew install ffmpeg
   ```

3. Verify installation:
   ```
   ffmpeg -version
   ```

## Linux

### Debian/Ubuntu:

```
sudo apt update
sudo apt install ffmpeg
```

### CentOS/RHEL:

```
sudo dnf install epel-release
sudo dnf install ffmpeg
```

### Verify installation:

```
ffmpeg -version
```

## After Installation

After installing FFmpeg, restart your terminal/command prompt and the application server for the changes to take effect.
