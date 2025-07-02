//% weight=100 color=#0fbc11 icon="\uf1eb"
namespace SMCP {
    export enum RadioMessage {
        ImHere = 59049,
        RUReal = 51673,
        AndU = 54968,
        Done = 52625,
        Sure = 12631,
        StillThere = 25073,
        Yup = 31339,
        AnyOneThere = 32263,
        message1 = 49434
    }

    let LastConnection = 0
    let Pic: Image[] = []
    let MSG: number[] = []
    let ComPry = -1
    let Connected = -1
    let ConnectedTo = -1
    let ConnectingStage = -1
    let Started = false
    let ReqPryVar = -1

    function ConnectingAttReset() {
        basic.showLeds(`
            # # # # #
            . # . # .
            . # . # .
            . # . # .
            # # # # #
            `)
        music._playDefaultBackground(music.builtInPlayableMelody(Melodies.PowerDown), music.PlaybackMode.UntilDone)
        flashstorage.put("Disconnected", "1")
        control.reset()
    }

    function Lists() {
        MSG = [
            59049,
            51673,
            54968,
            52625,
            12631
        ]
        Pic = [
            images.createImage(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            # # . . .
            `),
            images.createImage(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            # # # . .
            `),
            images.createImage(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            # # # # .
            `),
            images.createImage(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            # # # # #
            `)
        ]
    }
    radio.onReceivedMessage(RadioMessage.Sure, function () {
        if (ConnectingStage == 2 && ConnectedTo == radio.receivedPacket(RadioPacketProperty.SerialNumber)) {
            ConnectedTo = radio.receivedPacket(RadioPacketProperty.SerialNumber)
            ConnectingStage = 3
            Connected = 1
            ComPry = 1
            basic.showLeds(`
                . # . . .
                . . . . .
                . . . . .
                . . . . .
                # # # # .
                `)
        }
    })
    radio.onReceivedMessage(RadioMessage.Yup, function () {
        LastConnection = input.runningTime()
        ConnectingStage = 4
        Connected = 1
    })
    radio.onReceivedMessage(RadioMessage.Done, function () {
        Connected = 1
        ComPry = 0
        Connecting(3, 0, radio.receivedPacket(RadioPacketProperty.SerialNumber), 4)
    })
    radio.onReceivedMessage(RadioMessage.ImHere, function () {
        if (ReqPryVar == 1 || ReqPryVar == -1) {
            Connecting(1, 1, radio.receivedPacket(RadioPacketProperty.SerialNumber), 1)
        }
    })
    radio.onReceivedMessage(RadioMessage.StillThere, function () {
        Connected = 1
        if (ConnectedTo == radio.receivedPacket(RadioPacketProperty.SerialNumber)) {
            radio.sendMessage(RadioMessage.Yup)
            ConnectedTo = radio.receivedPacket(RadioPacketProperty.SerialNumber)
            LastConnection = input.runningTime()
            ConnectingStage = 4
            Connected = 1
            ComPry = 0
        }
    })
    function Connecting(NextCS: number, CP: number, CN: number, Radio: number) {
        if ((NextCS == 1 || ConnectedTo == CN) && (ConnectingStage == NextCS - 1 && Started)) {
            if (NextCS == 1) {
                ComPry = CP
                ConnectedTo = CN
            }
            music.play(music.tonePlayable(131, music.beat(BeatFraction.Eighth)), music.PlaybackMode.InBackground)
            ConnectingStage = NextCS
            Pic[NextCS - 1].showImage(0, 0)
            led.plot(ComPry, 0)
            basic.pause(100)
            radio.sendMessage(MSG[Radio])
            if (NextCS == 3) {
                basic.pause(5000)
            } else {
                basic.pause(1000)
            }
            if (ConnectingStage == NextCS) {
                music.play(music.tonePlayable(494, music.beat(BeatFraction.Double)), music.PlaybackMode.InBackground)
                for (let index = 0; index <= 5; index++) {
                    basic.showNumber(index)
                    basic.pause(200)
                    if (index == 5 && ConnectingStage == NextCS) {
                        ConnectingAttReset()
                    }
                    if (Connected == 0 && ConnectingStage == NextCS) {
                        radio.sendMessage(MSG[Radio])
                        music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
                    } else {
                        break;
                    }
                }
            }
        }
    }
    radio.onReceivedMessage(RadioMessage.RUReal, function () {
        Connecting(2, 0, radio.receivedPacket(RadioPacketProperty.SerialNumber), 2)
    })
    radio.onReceivedMessage(RadioMessage.AndU, function () {
        Connecting(2, 1, radio.receivedPacket(RadioPacketProperty.SerialNumber), 3)
    })
    radio.onReceivedMessage(RadioMessage.AnyOneThere, function () {
        if (ReqPryVar == 0 || ReqPryVar == -1) {
            Connecting(1, 0, radio.receivedPacket(RadioPacketProperty.SerialNumber), 0)
        }
    })

    //% blockId="init" block="initialise smcp|| in radio group $group with AB confirmation $AB" blockExternalInputs=true
    //% group.defl=1
    //% group.min=1 group.max=255
    //% AB.defl=true
    export function init(group?:number, AB?:boolean) {
        LastConnection = 0
        Pic = []
        MSG = []
        ComPry = 0
        Connected = 0
        ConnectedTo = 0
        ConnectingStage = 0
        Started = false
        if (flashstorage.getOrDefault("Disconnected", "0") == "0") {
            Started = false
            Lists()
            radio.setTransmitSerialNumber(true)
            radio.setGroup(group || 1)
            ConnectingStage = 0
            ConnectedTo = 0
            Connected = 0
            ComPry = -1
            if (true) {
                music._playDefaultBackground(music.builtInPlayableMelody(Melodies.Ringtone), music.PlaybackMode.InBackground)
            }
            images.createBigImage(`
                # # # . # . . . # .
                # . . . # # . # # .
                # # # . # . # . # .
                . . # . # . . . # .
                # # # . # . . . # .
                `).scrollImage(1, 100)
            images.createBigImage(`
                # # # . # # # . . .
                # . . . # . # . . .
                # . . . # # # . # #
                # . . . # . . . . .
                # # # . # . . . . .
                `).scrollImage(1, 100)
            images.createBigImage(`
                # . . . . . . . . .
                . # . . . . . . . .
                # # # . . # . . . #
                . # . . . . . . . .
                # . . . . . . . . .
                `).scrollImage(1, 100)
            while (!(input.buttonIsPressed(Button.AB)) && (AB !== undefined ? AB : true)) {
                basic.showLeds(`
                    . . . . .
                    . . . . .
                    # . . . #
                    . . . . .
                    . . . . .
                    `)
                basic.showLeds(`
                    . . . . .
                    . # . # .
                    . . . . .
                    . # . # .
                    . . . . .
                    `)
            }
            basic.showLeds(`
                . . . . .
                . . . . #
                . . . # .
                # . # . .
                . # . . .
                `)
            basic.showString(AB.toString())
            Started = true
        } else {
            flashstorage.remove("Disconnected")
            flashstorage.put("Disconnected", "0")
            ConnectingStage = 0
            ConnectedTo = 0
            Connected = 0
            ComPry = 0
            radio.setTransmitSerialNumber(true)
            radio.setGroup(1)
            Lists()
            basic.showLeds(`
                # . . . #
                . # . # .
                . . # . .
                . # . # .
                # . . . #
                `)
            basic.pause(1000)
            if (input.buttonIsPressed(Button.AB)) {
                flashstorage.remove("Disconnected")
                control.reset()
            }
            Started = true
        }
    }

    //% blockId="check" block="check connection|| disconnect after $disconnect ms and beep after $beep ms of no connection" blockExternalInputs=true
    //% beep.defl=1000
    //% beep.min=1000 beep.max=disconnect
    //% disconnect.defl=5000
    //% disconnect.min=beep disconnect.max=10000
    export function check(beep?:number, disconnect?:number) {
        if (Connected == 1) {
            if (ComPry == 1) {
                radio.sendMessage(RadioMessage.StillThere)
            }
            basic.pause(500)
            if ((ConnectingStage == 4 && Started)) {
                if (LastConnection + (disconnect !== undefined ? disconnect : 5000) < input.runningTime()) {
                    ConnectingAttReset()
                } else if (LastConnection + beep < input.runningTime()) {
                    music.play(music.tonePlayable(988, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
                }
            }
        }
    }

    //% blockId="connect" block="connect to other microbit|| Communication priority for this device is $ReqPry" blockExternalInputs=true
    //% ReqPry.defl=-1
    //% ReqPry.min=-1 ReqPry.max=1
    export function connect(ReqPry?:number) {
        ReqPryVar = ReqPry
        while (Connected == 0 && ConnectingStage == 0 && (ReqPry == 1 || ReqPry == -1)) {
            flashstorage.remove("Disconnected")
            radio.sendMessage(RadioMessage.AnyOneThere)
            basic.showLeds(`
                . . . . #
                . . # . #
                # . # . #
                . . # . #
                . . . . #
                `)
            basic.pause(1000)
            LastConnection = input.runningTime()
        }
        while (Connected != 1) {
            basic.pause(1000)
            LastConnection = input.runningTime()
        }
        LastConnection = input.runningTime()
        Pic = []
        MSG = []
        basic.showLeds(`
            # . . . #
            . . . . .
            . . . . .
            . . . . .
            # . . . #
            `)
        basic.pause(1000)
        LastConnection = input.runningTime()
    }

}