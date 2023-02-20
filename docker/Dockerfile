FROM debian:11

# Upgrade and cleanup packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    apt-get clean

# Install Chromium and VNC server
RUN apt-get install -y \
    chromium \
    tigervnc-standalone-server
    
# Create a user and set their home directory
RUN useradd --create-home --shell /bin/false user

# Ensure the .vnc directory is writable by the user
RUN mkdir /home/user/.vnc && chown user:user /home/user/.vnc && chmod 700 /home/user/.vnc

# Copy the xstartup file into the container
COPY xstartup /home/user/.vnc/xstartup
RUN chown user:user /home/user/.vnc/xstartup && chmod +x /home/user/.vnc/xstartup

# Expose the VNC port
EXPOSE 5901

# Start the VNC server as the user
USER user
WORKDIR /home/user
CMD ["vncserver", "-SecurityTypes", "none", "--I-KNOW-THIS-IS-INSECURE", "-fg", "-geometry", "1280x720", "-depth", "24", "-localhost", "no", "-xstartup", "/home/user/.vnc/xstartup"]
