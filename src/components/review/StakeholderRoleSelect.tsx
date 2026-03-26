import { Select } from "@/components/common/Select";
import { stakeholderRoleConfig, stakeholderRoles } from "@/features/stakeholder-role/roleConfig";
import { StakeholderRole } from "@/types/review";

interface StakeholderRoleSelectProps {
  value: StakeholderRole;
  onChange: (role: StakeholderRole) => void;
}

export function StakeholderRoleSelect({ value, onChange }: StakeholderRoleSelectProps) {
  return (
    <Select
      label="Stakeholder"
      value={value}
      onChange={(event) => onChange(event.target.value as StakeholderRole)}
      helperText={stakeholderRoleConfig[value].helpText}
    >
      {stakeholderRoles.map((role) => (
        <option key={role} value={role}>
          {role} - {stakeholderRoleConfig[role].label}
        </option>
      ))}
    </Select>
  );
}
