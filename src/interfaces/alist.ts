export interface IAListRoute {
  route: string;
  path: string;
  type: "random-image";
}

export interface IAListResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface IAListFile {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  created: string;
  sign: string;
  thumb: string;
  type: number;
  hashinfo: string;
  hash_info: null;
}

export interface IAListFileDetails extends IAListFile {
  raw_url: string;
  readme: string;
  header: string;
  provider: string;
  related: null;
}
