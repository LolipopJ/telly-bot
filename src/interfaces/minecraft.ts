export interface IMinecraftServerStatus {
  online: boolean;
  host: string;
  port: number;
  ip_address: string;
  eula_blocked: boolean;
  retrieved_at: number;
  expires_at: number;
  srv_record: unknown;
  version: {
    name_raw: string;
    name_clean: string;
    name_html: string;
    protocol: number;
  };
  players: {
    online: number;
    max: number;
    list: IMinecraftServerPlayer[];
  };
  motd: {
    raw: string;
    clean: string;
    html: string;
  };
  icon: string;
  mods: unknown[];
  software: unknown;
  plugins: unknown[];
}

export interface IMinecraftServerPlayer {
  uuid: string;
  name_raw: string;
  name_clean: string;
  name_html: string;
}
