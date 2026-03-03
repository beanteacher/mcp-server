export namespace GitHubDto {
  export type CommitAuthor = {
    name: string;
    date: string;
  };

  export type Commit = {
    sha: string;
    commit: {
      message: string;
      author: CommitAuthor | null;
    };
    html_url: string;
  };

  export type CommitFile = {
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed';
    additions: number;
    deletions: number;
    patch?: string;
  };

  export type CommitDetail = Commit & {
    files: CommitFile[];
    stats: { additions: number; deletions: number; total: number };
  };

  export type Repo = {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    language: string | null;
    updated_at: string;
    private: boolean;
  };

  export type ErrorBody = {
    message?: string;
  };
}
