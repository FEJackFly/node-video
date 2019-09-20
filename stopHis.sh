#!/bin/bash
echo "restart..."
pid=`ps -ef | grep playType=his | awk '{print $2}'`
if [ -n "$pid" ]
then
   kill -9 $pid
   echo "kill pid:"$pid
fi
echo "kill pid finish..."
