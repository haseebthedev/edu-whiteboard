import {
    HistoryEntry,
    StoreListener,
    TLRecord,
    TLStoreWithStatus,
    createTLStore,
    defaultShapeUtils,
    throttle,
    uniqueId,
} from 'tldraw'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const clientId = uniqueId()

export function useSyncStore({
    hostUrl,
    version = 1,
    roomId = 'example',
}: {
    hostUrl: string
    version?: number
    roomId?: string
}) {
    const [store] = useState(() => {
        const store = createTLStore({
            shapeUtils: [...defaultShapeUtils],
        })
        return store
    })

    const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
        status: 'loading',
    })

    useEffect(() => {
        const socket: Socket = io(hostUrl, {
            query: { room: `${roomId}_${version}` },
        })

        setStoreWithStatus({ status: 'loading' })

        const unsubs: (() => void)[] = []

        const handleOpen = () => {
            setStoreWithStatus({
                status: 'synced-remote',
                connectionStatus: 'online',
                store,
            })

            socket.on('message', handleMessage)
            unsubs.push(() => socket.off('message', handleMessage))
        }

        const handleClose = () => {
            setStoreWithStatus({
                status: 'synced-remote',
                connectionStatus: 'offline',
                store,
            })
        }

        const handleMessage = (data: any) => {
            if (data.clientId === clientId) return

            switch (data.type) {
                case 'init': {
                    store.loadSnapshot(data.snapshot)
                    break
                }
                case 'recovery': {
                    store.loadSnapshot(data.snapshot)
                    break
                }
                case 'update': {
                    try {
                        for (const update of data.updates) {
                            store.mergeRemoteChanges(() => {
                                const {
                                    changes: { added, updated, removed },
                                } = update as HistoryEntry<TLRecord>

                                for (const record of Object.values(added)) {
                                    store.put([record])
                                }
                                for (const [, to] of Object.values(updated)) {
                                    store.put([to])
                                }
                                for (const record of Object.values(removed)) {
                                    store.remove([record.id])
                                }
                            })
                        }
                    } catch (e) {
                        console.error(e)
                        socket.emit('recovery', { clientId })
                    }
                    break
                }
            }
        }

        const pendingChanges: HistoryEntry<TLRecord>[] = []
        const sendChanges = throttle(() => {
            if (pendingChanges.length === 0) return
            socket.emit('update', {
                clientId,
                type: 'update',
                updates: pendingChanges,
            })
            pendingChanges.length = 0
        }, 32)

        const handleChange: StoreListener<TLRecord> = (event) => {
            if (event.source !== 'user') return
            pendingChanges.push(event)
            sendChanges()
        }

        socket.on('connect', handleOpen)
        socket.on('disconnect', handleClose)

        unsubs.push(
            store.listen(handleChange, {
                source: 'user',
                scope: 'document',
            })
        )

        return () => {
            unsubs.forEach((fn) => fn())
            unsubs.length = 0
            socket.disconnect()
        }
    }, [store, hostUrl, roomId, version])

    return storeWithStatus
}
