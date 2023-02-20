#!/bin/sh

unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
#/etc/X11/xinit/xinitrc
# Assume either Gnome will be started by default when installed
# We want to kill the session automatically in this case when user logs out. In case you modify
# /etc/X11/xinit/Xclients or ~/.Xclients yourself to achieve a different result, then you should
# be responsible to modify below code to avoid that your session will be automatically killed
#if [ -e /usr/bin/gnome-session ]; then
#    vncserver -kill $DISPLAY
#fi
/usr/bin/chromium-browser --no-first-run --no-default-browser-check --guest --window-position=0,0 --window-size=1280,720