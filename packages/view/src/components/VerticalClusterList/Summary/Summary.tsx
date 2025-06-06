import { useRef, useEffect } from "react";
import type { ListRowProps } from "react-virtualized";
import { List, AutoSizer } from "react-virtualized";
import { useShallow } from "zustand/react/shallow";

import type { ClusterNode } from "types";
import { Detail } from "components";
import { useDataStore } from "store";

import "./Summary.scss";
import { Author } from "../../@common/Author";
import { selectedDataUpdater } from "../VerticalClusterList.util";
import { ClusterGraph } from "../ClusterGraph";
import { getClusterSizes } from "../ClusterGraph/ClusterGraph.util";
import { CLUSTER_HEIGHT, DETAIL_HEIGHT, NODE_GAP } from "../ClusterGraph/ClusterGraph.const";

import { usePreLoadAuthorImg } from "./Summary.hook";
import { getInitData, getClusterIds, getClusterById, getCommitLatestTag } from "./Summary.util";
import { Content } from "./Content";

const COLLAPSED_ROW_HEIGHT = CLUSTER_HEIGHT + NODE_GAP * 2;
const EXPANDED_ROW_HEIGHT = DETAIL_HEIGHT + COLLAPSED_ROW_HEIGHT;

const Summary = () => {
  const [filteredData, selectedData, setSelectedData] = useDataStore(
    useShallow((state) => [state.filteredData, state.selectedData, state.setSelectedData])
  );
  const clusters = getInitData(filteredData);
  const detailRef = useRef<HTMLDivElement>(null);
  const authSrcMap = usePreLoadAuthorImg();
  const selectedClusterId = getClusterIds(selectedData);
  const listRef = useRef<List>(null);
  const clusterSizes = getClusterSizes(filteredData);

  const onClickClusterSummary = (clusterId: number) => () => {
    const selected = getClusterById(filteredData, clusterId);
    setSelectedData((prevState: ClusterNode[]) => {
      return selectedDataUpdater(selected, clusterId)(prevState);
    });
  };

  useEffect(() => {
    detailRef.current?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    if (listRef.current) {
      listRef.current.recomputeRowHeights();
    }
  }, [selectedData]);

  const getRowHeight = ({ index }: { index: number }) => {
    const cluster = clusters[index];
    return selectedClusterId.includes(cluster.clusterId) ? EXPANDED_ROW_HEIGHT : COLLAPSED_ROW_HEIGHT;
  };

  const rowRenderer = ({ index, key, style }: ListRowProps) => {
    const cluster = clusters[index];
    const isExpanded = selectedClusterId.includes(cluster.clusterId);

    return (
      <div
        key={key}
        style={style}
        className="cluster-summary__item"
      >
        <div className="cluster-summary__graph">
          <ClusterGraph
            data={[filteredData[index]]}
            clusterSizes={[clusterSizes[index]]}
          />
        </div>
        <div className={`cluster-summary__info${isExpanded ? "--expanded" : ""}`}>
          <button
            type="button"
            className="summary"
            onClick={onClickClusterSummary(cluster.clusterId)}
          >
            <div className="summary__author">
              {authSrcMap &&
                cluster.summary.authorNames.map((authorArray: string[]) => {
                  return authorArray.map((authorName: string) => (
                    <Author
                      key={authorName}
                      name={authorName}
                      src={authSrcMap[authorName]}
                    />
                  ));
                })}
            </div>
            <div>{getCommitLatestTag(cluster.clusterTags)}</div>
            <Content
              content={cluster.summary.content}
              clusterId={cluster.clusterId}
              selectedClusterId={selectedClusterId}
            />
          </button>
          {isExpanded && (
            <div
              className="detail"
              ref={detailRef}
            >
              <Detail
                selectedData={selectedData}
                clusterId={cluster.clusterId}
                authSrcMap={authSrcMap}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="vertical-cluster-list__body">
      <AutoSizer>
        {({ width, height }) => (
          <List
            ref={listRef}
            width={width}
            height={height}
            rowCount={clusters.length}
            rowHeight={getRowHeight}
            rowRenderer={rowRenderer}
            overscanRowCount={15}
            className="cluster-summary"
          />
        )}
      </AutoSizer>
    </div>
  );
};

export default Summary;
