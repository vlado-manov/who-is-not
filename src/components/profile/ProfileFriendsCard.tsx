import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Animated,
  Pressable,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import CustomText from "../common/CustomText";
import { useAuthStore } from "../../store/useUserStore";
import { useGameStore } from "../../store/useGameStore";
import AudioManager from "../../utils/audioManager";
import {
  fetchFriends,
  fetchFriendRequests,
  searchFriends,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  inviteFriendToGame,
  type FriendItem,
  type PendingRequest,
  type FriendSearchResult,
} from "../../api/friends";

const CARD_SHADOW = {
  shadowColor: "#000" as const,
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 3 },
  elevation: 5,
};

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ url, size = 34 }: { url: string | null; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "rgba(16,185,129,0.1)",
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: "rgba(16,185,129,0.25)",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} />
      ) : (
        <Ionicons name="person" size={size * 0.52} color="#10b981" />
      )}
    </View>
  );
}

// ── Friend row ────────────────────────────────────────────────────────────────
function FriendRow({
  item,
  onRemove,
  onInvite,
  inviting,
}: {
  item: FriendItem;
  onRemove: (friendshipId: string) => void;
  onInvite: (friendshipId: string) => void;
  inviting: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={S.row}>
      <Avatar url={item.avatarUrl} />
      <CustomText style={S.rowName} numberOfLines={1}>
        {item.name}
      </CustomText>
      {/* Invite to game */}
      <TouchableOpacity
        hitSlop={8}
        style={[
          S.actionBtn,
          { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.35)" },
        ]}
        onPress={() => onInvite(item.friendshipId)}
        disabled={inviting}
      >
        <Ionicons
          name={inviting ? "checkmark" : "game-controller-outline"}
          size={18}
          color={inviting ? "#9ca3af" : "#059669"}
        />
      </TouchableOpacity>
      {/* Remove */}
      <TouchableOpacity
        hitSlop={8}
        onPress={() =>
          Alert.alert(
            t("friends_remove_title"),
            t("friends_remove_confirm", { name: item.name }),
            [
              { text: t("cancel"), style: "cancel" },
              {
                text: t("friends_remove_btn"),
                style: "destructive",
                onPress: () => onRemove(item.friendshipId),
              },
            ]
          )
        }
      >
        <Ionicons name="person-remove-outline" size={20} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );
}

// ── Pending request row ───────────────────────────────────────────────────────
function RequestRow({
  item,
  onAccept,
  onReject,
}: {
  item: PendingRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <View style={S.row}>
      <Avatar url={item.avatarUrl} />
      <CustomText style={[S.rowName, { flex: 1 }]} numberOfLines={1}>
        {item.name}
      </CustomText>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <TouchableOpacity
          style={[S.actionBtn, { backgroundColor: "rgba(16,185,129,0.12)", borderColor: "#10b981" }]}
          onPress={() => onAccept(item.friendshipId)}
        >
          <Ionicons name="checkmark" size={18} color="#059669" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.actionBtn, { backgroundColor: "rgba(220,38,38,0.08)", borderColor: "#fca5a5" }]}
          onPress={() => onReject(item.friendshipId)}
        >
          <Ionicons name="close" size={18} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Search result row ─────────────────────────────────────────────────────────
function SearchRow({
  item,
  onAdd,
  sent,
}: {
  item: FriendSearchResult;
  onAdd: (userId: string) => void;
  sent: boolean;
}) {
  return (
    <View style={S.row}>
      <Avatar url={item.avatarUrl} />
      <CustomText style={[S.rowName, { flex: 1 }]} numberOfLines={1}>
        {item.name}
      </CustomText>
      <TouchableOpacity
        disabled={sent}
        style={[
          S.actionBtn,
          sent
            ? { backgroundColor: "rgba(0,0,0,0.04)", borderColor: "#e5e7eb" }
            : { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "#10b981" },
        ]}
        onPress={() => onAdd(item.userId)}
      >
        {sent ? (
          <Ionicons name="checkmark" size={18} color="#9ca3af" />
        ) : (
          <Ionicons name="person-add-outline" size={18} color="#059669" />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <View style={S.sectionLabelRow}>
      <CustomText style={S.sectionLabelText}>{label}</CustomText>
    </View>
  );
}

// ── Row divider ───────────────────────────────────────────────────────────────
function RowDivider({ indent = false }: { indent?: boolean }) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: "rgba(0,0,0,0.05)",
        marginHorizontal: indent ? 52 : 0,
      }}
    />
  );
}

// ── Add Friend Modal ──────────────────────────────────────────────────────────
function AddFriendModal({
  visible,
  userId,
  onClose,
}: {
  visible: boolean;
  userId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setSentIds(new Set());
    }
  }, [visible]);

  const handleSearch = useCallback(
    async (q: string) => {
      setQuery(q);
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await searchFriends(userId, q);
        setResults(data.items);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const handleAdd = useCallback(
    async (targetId: string) => {
      try {
        await sendFriendRequest(userId, targetId);
        setSentIds((prev) => new Set([...prev, targetId]));
      } catch (e: any) {
        Alert.alert(t("error"), e?.message ?? t("friends_request_error"));
      }
    },
    [userId, t]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={M.backdrop}>
        <View style={M.card}>
          {/* Header */}
          <View style={M.header}>
            <View style={M.iconWrap}>
              <Ionicons name="person-add-outline" size={18} color="#059669" />
            </View>
            <CustomText style={M.title}>{t("friends_add_title")}</CustomText>
            <TouchableOpacity hitSlop={10} onPress={onClose}>
              <Ionicons name="close" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={M.divider} />

          {/* Search */}
          <View style={M.searchRow}>
            <Ionicons name="search" size={15} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              style={M.searchInput}
              placeholder={t("friends_search_placeholder")}
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" color="#10b981" />}
          </View>

          <ScrollView
            style={{ maxHeight: 300 }}
            showsVerticalScrollIndicator={false}
          >
            {results.length === 0 && query.trim().length >= 2 && !loading && (
              <CustomText style={M.emptyText}>{t("friends_no_results")}</CustomText>
            )}
            {results.map((r, i) => (
              <React.Fragment key={r.userId}>
                <SearchRow item={r} onAdd={handleAdd} sent={sentIds.has(r.userId)} />
                {i < results.length - 1 && <RowDivider indent />}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────
const ProfileFriendsCard = () => {
  const { t } = useTranslation();
  const authStatus = useAuthStore((s) => s.authStatus);
  const userId = useAuthStore((s) => s.user.id);
  const activeJoinCode = useGameStore((s) => s.roomCode);

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [received, setReceived] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [invitingSent, setInvitingSent] = useState<Set<string>>(new Set());

  // Arrow bounce animation (same as SavedQuestionsCard)
  const arrowBounce = useRef(new Animated.Value(0)).current;
  const bounceLoop = useRef<Animated.CompositeAnimation | null>(null);
  const pressAnim = useRef(new Animated.Value(1)).current;

  // Expand animation
  const expandAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      speed: 9,
      bounciness: 6,
      useNativeDriver: false,
    } as any).start();
  }, [expanded, expandAnim]);

  useEffect(() => {
    if (expanded) {
      bounceLoop.current?.stop();
      arrowBounce.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounce, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(arrowBounce, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2400),
      ])
    );
    bounceLoop.current = loop;
    loop.start();
    return () => loop.stop();
  }, [expanded, arrowBounce]);

  const arrowY = arrowBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  const pressIn = () =>
    Animated.spring(pressAnim, {
      toValue: 0.98,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    } as any).start();
  const pressOut = () =>
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 24,
      bounciness: 6,
      useNativeDriver: true,
    } as any).start();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [fl, rl] = await Promise.all([
        fetchFriends(userId),
        fetchFriendRequests(userId),
      ]);
      setFriends(fl.items);
      setReceived(rl.received);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authStatus !== "guest") load();
  }, [authStatus, load]);

  const handleAccept = useCallback(
    async (friendshipId: string) => {
      try {
        await respondToFriendRequest(userId, friendshipId, "ACCEPTED");
        await load();
      } catch {}
    },
    [userId, load]
  );

  const handleReject = useCallback(
    async (friendshipId: string) => {
      try {
        await respondToFriendRequest(userId, friendshipId, "REJECTED");
        setReceived((prev) =>
          prev.filter((r) => r.friendshipId !== friendshipId)
        );
      } catch {}
    },
    [userId]
  );

  const handleRemove = useCallback(
    async (friendshipId: string) => {
      try {
        await removeFriend(userId, friendshipId);
        setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
      } catch {}
    },
    [userId]
  );

  const handleInvite = useCallback(
    async (friendshipId: string) => {
      if (invitingSent.has(friendshipId)) return;
      try {
        await inviteFriendToGame(userId, friendshipId, activeJoinCode);
        setInvitingSent((prev) => new Set([...prev, friendshipId]));
        setTimeout(
          () =>
            setInvitingSent((prev) => {
              const next = new Set(prev);
              next.delete(friendshipId);
              return next;
            }),
          4000,
        );
      } catch {}
    },
    [userId, activeJoinCode, invitingSent],
  );

  if (authStatus === "guest") return null;

  const totalFriends = friends.length;
  const pendingCount = received.length;

  // Items shown before expansion
  const PREVIEW_COUNT = 3;
  const visibleFriends = expanded ? friends : friends.slice(0, PREVIEW_COUNT);
  const hiddenCount = friends.length - PREVIEW_COUNT;

  // Row heights for the animated expand (header 52 + each row ~53 + section label 36)
  const expandedHeight =
    (pendingCount > 0 ? 36 + pendingCount * 53 + 8 : 0) +
    (totalFriends > 0 ? 36 + totalFriends * 53 : 0) +
    (totalFriends === 0 ? 44 : 0) +
    (hiddenCount > 0 ? 40 : 0) +
    16;

  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(expandedHeight, 60)],
  });

  return (
    <View style={C.card}>
      {/* ── Header (always visible, tap to expand) ────────────────────────── */}
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        <Pressable
          onPress={() => {
            AudioManager.playButtonClick();
            setExpanded((v) => !v);
          }}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={C.header}
        >
          <View style={C.iconWrap}>
            <Ionicons name="people-outline" size={18} color="#10b981" />
          </View>
          <CustomText style={C.headerTitle}>{t("friends_title")}</CustomText>
          {/* Friend count badge */}
          <View style={C.badge}>
            <CustomText style={C.badgeNum}>
              {loading ? "…" : totalFriends}
            </CustomText>
          </View>
          {/* Pending indicator */}
          {pendingCount > 0 && (
            <View style={C.pendingBadge}>
              <CustomText style={C.pendingNum}>{pendingCount}</CustomText>
            </View>
          )}
          {/* Add button */}
          <TouchableOpacity
            hitSlop={8}
            style={C.addBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              AudioManager.playButtonClick();
              setAddVisible(true);
            }}
          >
            <Ionicons name="person-add-outline" size={15} color="#059669" />
          </TouchableOpacity>
          {/* Collapse arrow */}
          <Animated.View
            style={{ transform: [{ translateY: expanded ? 0 : arrowY }] }}
          >
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9ca3af"
            />
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* ── Expandable body ───────────────────────────────────────────────── */}
      <Animated.View
        style={[C.listWrap, { maxHeight }]}
        pointerEvents={expanded ? "auto" : "none"}
      >
        <View style={C.topDivider} />

        {/* Pending requests */}
        {pendingCount > 0 && (
          <>
            <SectionLabel label={t("friends_requests_label")} />
            {received.map((r, i) => (
              <React.Fragment key={r.friendshipId}>
                <RequestRow
                  item={r}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
                {i < received.length - 1 && <RowDivider indent />}
              </React.Fragment>
            ))}
          </>
        )}

        {/* Friends list */}
        {totalFriends > 0 && (
          <>
            {pendingCount > 0 && <View style={C.sectionDivider} />}
            <SectionLabel label={t("friends_list_label")} />
            {visibleFriends.map((f, i) => (
              <React.Fragment key={f.friendshipId}>
                <FriendRow
                  item={f}
                  onRemove={handleRemove}
                  onInvite={handleInvite}
                  inviting={invitingSent.has(f.friendshipId)}
                />
                {i < visibleFriends.length - 1 && <RowDivider indent />}
              </React.Fragment>
            ))}
            {hiddenCount > 0 && (
              <TouchableOpacity
                hitSlop={8}
                style={C.showMoreBtn}
                onPress={() => setExpanded(true)}
              >
                <CustomText style={C.showMoreText}>
                  {t("friends_show_more", { count: hiddenCount })}
                </CustomText>
                <Ionicons name="chevron-down" size={13} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && totalFriends === 0 && pendingCount === 0 && (
          <CustomText style={C.emptyText}>{t("friends_empty")}</CustomText>
        )}
        {loading && (
          <ActivityIndicator
            size="small"
            color="#10b981"
            style={{ marginVertical: 16 }}
          />
        )}
      </Animated.View>

      <AddFriendModal
        visible={addVisible}
        userId={userId}
        onClose={() => {
          setAddVisible(false);
          load();
        }}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const C = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    ...CARD_SHADOW,
    marginHorizontal: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(16,185,129,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: { flex: 1, color: "#1f2937", fontSize: 14, fontWeight: "800" },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeNum: { color: "#78350f", fontSize: 13, fontWeight: "900" },
  pendingBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  pendingNum: { color: "#dc2626", fontSize: 11, fontWeight: "900" },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  listWrap: { overflow: "hidden" },
  topDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 0,
    marginTop: 4,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  showMoreText: { color: "#9ca3af", fontSize: 12 },
});

const S = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: "#fff",
  },
  rowName: {
    flex: 1,
    color: "#1f2937",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabelRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionLabelText: {
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
});

// ── Modal styles ──────────────────────────────────────────────────────────────
const M = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    ...CARD_SHADOW,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(16,185,129,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: { flex: 1, color: "#1f2937", fontSize: 14, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginHorizontal: 16 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    color: "#1f2937",
    fontSize: 14,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
});

export default ProfileFriendsCard;
