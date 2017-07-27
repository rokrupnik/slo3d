# !/bin/bash
# Global limits x: 374 - 623: 250, y: 31 - 194: 164
b=11;
for ((x=389;x<=425;x++));
do
    for ((y=56;y<=84;y++));
    do
        # If download successful, call asc2png, and if conversion is successfull, delete the asc file
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=12;
for ((x=418;x<=466;x++));
do
    for ((y=38;y<=84;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=13;
for ((x=445;x<=493;x++));
do
    for ((y=35;y<=84;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=14;
for ((x=500;x<=556;x++));
do
    for ((y=69;y<=114;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=15;
for ((x=414;x<=450;x++));
do
    for ((y=34;y<=65;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=16;
for ((x=474;x<=531;x++));
do
    for ((y=31;y<=84;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=21;
for ((x=387;x<=418;x++));
do
    for ((y=32;y<=54;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=22;
for ((x=500;x<=544;x++));
do
    for ((y=107;y<=139;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=23;
for ((x=486;x<=544;x++));
do
    for ((y=140;y<=169;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=24;
for ((x=572;x<=623;x++));
do
    for ((y=127;y<=194;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=25;
for ((x=554;x<=571;x++));
do
    for ((y=135;y<=176;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=26;
for ((x=539;x<=571;x++));
do
    for ((y=115;y<=174;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=31;
for ((x=399;x<=499;x++));
do
    for ((y=127;y<=154;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=32;
for ((x=406;x<=452;x++));
do
    for ((y=85;y<=122;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=33;
for ((x=375;x<=427;x++));
do
    for ((y=85;y<=127;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=34;
for ((x=475;x<=499;x++));
do
    for ((y=111;y<=135;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=35;
for ((x=453;x<=499;x++));
do
    for ((y=85;y<=110;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=36;
for ((x=425;x<=474;x++));
do
    for ((y=111;y<=145;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done

b=37;
for ((x=374;x<=438;x++));
do
    for ((y=115;y<=148;y++));
    do
        [ ! -e "../tiles/10/"$x"_"$y".png" ] && wget "http://gis.arso.gov.si/lidar/dmr1/b_"$b"/D96TM/TM1_"$x"_"$y".asc" && python ../../scripts/asc2png.py $x $y && rm "TM1_"$x"_"$y".asc"
    done
done