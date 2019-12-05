#!/usr/bin/python
import sys
import time
import RPi.GPIO as GPIO
 
GPIO.setmode(GPIO.BOARD)
GPIO.setwarnings(False)

aMotorPins = [7, 8, 11, 12]
 
# Set all pins as output
for pin in aMotorPins:
	GPIO.setup(pin,GPIO.OUT)
	GPIO.output(pin, False)

aSequence = [
	[1,0,0,1],
	[1,0,0,0],
	[1,1,0,0],
	[0,1,0,0],
	[0,1,1,0],
	[0,0,1,0],
	[0,0,1,1],
	[0,0,0,1]
]
        
iNumSteps = len(aSequence)


iDirection = 1

fWaitTime = int(1) / float(1000)

iDeg = int(int(23) * 11.377777777777)

iSeqPos = 0
# If the fourth argument is present, it means that the motor should start at a
# specific position from the aSequence list

# 1024 steps is 90 degrees
# 4096 steps is 360 degrees

for step in range(0,iDeg):

	for iPin in range(0, 4):
		iRealPin = aMotorPins[iPin]
		if aSequence[iSeqPos][iPin] != 0:
			GPIO.output(iRealPin, True)
		else:
			GPIO.output(iRealPin, False)
 
	iSeqPos += iDirection
 
	if (iSeqPos >= iNumSteps):
		iSeqPos = 0
	if (iSeqPos < 0):
		iSeqPos = iNumSteps + iDirection
 
	# Time to wait between steps
	time.sleep(fWaitTime)


iDirection = -1

for step in range(0,iDeg):

	for iPin in range(0, 4):
		iRealPin = aMotorPins[iPin]
		if aSequence[iSeqPos][iPin] != 0:
			GPIO.output(iRealPin, True)
		else:
			GPIO.output(iRealPin, False)
 
	iSeqPos += iDirection
 
	if (iSeqPos >= iNumSteps):
		iSeqPos = 0
	if (iSeqPos < 0):
		iSeqPos = iNumSteps + iDirection
 
	# Time to wait between steps
	time.sleep(fWaitTime)

for pin in aMotorPins:
	GPIO.output(pin, False)

# Print the position from the aSequence list which should have been the
# next position, if the previous loop was not ended
# Need to catch this output when running from another script

