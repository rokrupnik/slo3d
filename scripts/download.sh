#!/bin/bash
# Global limits x: 374 - 623: 250, y: 31 - 194: 164
for ((x=406;x<=452;x++));
do
    for ((y=85;y<=122;y++));
    do
        # your-unix-command-here
        #wget "http://gis.arso.gov.si/lidar/dmr1/b_32/D96TM/TM1_"$x"_"$y".asc"
        python ../asc2png/asc2png.py $x $y
    done
done