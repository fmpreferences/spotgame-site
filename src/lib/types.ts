export interface GameInfo {
    id: string
    title: string
    artist_name: string
    album_art: string
    date: string
}

export interface StreamInfo {
    id: string
    streams: number
}

export interface BtnData {
    id: string
    title: string
    artist_names: string
    album_art: string
}

export interface AlbumArtInfo {
    id: string
    album_art: string
}

export interface GetNumberSongsResult {
    count: number
}

export interface GetRandomSongsResult {
    random_songs: any[]
}

export interface GetStreamsResult {
    correct: string
    streamcounts: number[]
}