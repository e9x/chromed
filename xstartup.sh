#!/bin/sh

unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
/usr/bin/chromium-browser --no-first-run --no-default-browser-check --guest --window-position=0,0 --window-size=1280,720 --temp-profile
