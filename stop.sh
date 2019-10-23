#!/bin/bash
echo "restart..."
pid=`ps -ef | grep rtsp_transport | awk '{print $2}'`
if [ -n "$pid" ]
then
   kill -9 $pid
   echo "kill pid:"$pid
fi
echo "kill pid finish..."
