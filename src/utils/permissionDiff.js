// file: src/utils/permissionDiff.js

export function diffChanges(original, current, roles) {
  const changes = []

  for (const perm of current) {
    const before = original.find(o => o.permissionId === perm.permissionId)

    for (const role of roles) {
      const roleId = role.roleId

      const beforeVal = before.roles[roleId]
      const nowVal = perm.roles[roleId]

      if (beforeVal !== nowVal) {
        changes.push({
          key: `${perm.permissionId}-${roleId}`,
          roleId,
          roleName: role.roleName,
          permissionId: perm.permissionId,
          permissionName: perm.name,
          before: beforeVal,
          now: nowVal
        })
      }
    }
  }

  return changes
}
