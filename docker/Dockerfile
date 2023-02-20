FROM debian:11

# Install Chromium and VNC server
RUN apt-get update && apt-get install -y \
    chromium \
    tigervnc-standalone-server

# Copy the xstartup file into the container
COPY xstartup /root/.vnc/xstartup
RUN chmod +x /root/.vnc/xstartup

# Expose the VNC port
EXPOSE 5901

# Start the VNC server
CMD ["vncserver", "-SecurityTypes", "none", "--I-KNOW-THIS-IS-INSECURE", "-fg", "-geometry", "1280x720", "-depth", "24", "-localhost", "no", "-xstartup", "/root/.vnc/xstartup"]
